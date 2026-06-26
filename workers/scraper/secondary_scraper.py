"""
secondary_scraper.py — httpx + BeautifulSoup4 scraper for Naukri/Indeed static HTML.
Uses tenacity for exponential backoff retries on 429 / 503 errors.
"""
import asyncio
import re
from typing import List, Optional
from pydantic import BaseModel
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_result
import httpx
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

ua = UserAgent()


class SecondaryCandidate(BaseModel):
    name: str
    title: Optional[str] = None
    company: Optional[str] = None
    skills: List[str] = []
    profile_url: Optional[str] = None
    source: str = "naukri"
    data_confidence: str = "low"


def _is_rate_limited(response: httpx.Response) -> bool:
    return response.status_code in (429, 503)


@retry(
    wait=wait_exponential(min=1, max=60),
    stop=stop_after_attempt(5),
    retry=retry_if_result(_is_rate_limited),
)
async def _fetch(client: httpx.AsyncClient, url: str) -> httpx.Response:
    headers = {
        "User-Agent": ua.random,
        "Accept-Language": "en-US,en;q=0.9",
    }
    return await client.get(url, headers=headers, timeout=15, follow_redirects=True)


def _parse_naukri_results(html: str) -> List[SecondaryCandidate]:
    """Parse Naukri profile search results from raw HTML."""
    soup = BeautifulSoup(html, "html.parser")
    candidates = []
    
    # Naukri search result cards have class "srp-jobtuple-wrapper" or similar
    cards = soup.select("[data-job-id], .cust-job-tuple, .list-top-section")
    for card in cards:
        try:
            name_el = card.select_one(".jobTuple-jobName, .job-title, h2")
            title_el = card.select_one(".designation, .profile, .designation-link")
            company_el = card.select_one(".company-name, .subTitle")
            link_el = card.select_one("a[href]")

            name = re.sub(r"\s+", " ", name_el.get_text()).strip() if name_el else None
            title = re.sub(r"\s+", " ", title_el.get_text()).strip() if title_el else None
            company = re.sub(r"\s+", " ", company_el.get_text()).strip() if company_el else None
            href = link_el.get("href") if link_el else None

            if name:
                candidates.append(SecondaryCandidate(
                    name=name,
                    title=title,
                    company=company,
                    profile_url=href,
                    data_confidence="medium" if (name and title) else "low",
                ))
        except Exception:
            continue
    return candidates


async def scrape_naukri(query: str, max_results: int = 50) -> List[SecondaryCandidate]:
    """Scrape Naukri job seeker profiles for the given query."""
    results: List[SecondaryCandidate] = []
    base_url = "https://www.naukri.com/jobapi/v3/search"
    
    async with httpx.AsyncClient() as client:
        for page in range(1, 6):  # up to 5 pages
            if len(results) >= max_results:
                break
            try:
                url = f"https://www.naukri.com/{query.replace(' ', '-')}-jobs-{page}"
                response = await _fetch(client, url)
                page_results = _parse_naukri_results(response.text)
                results.extend(page_results)
                if not page_results:
                    break
                await asyncio.sleep(1.0)
            except Exception as e:
                print(f"Naukri scraper error on page {page}: {e}")
                break

    return results[:max_results]
