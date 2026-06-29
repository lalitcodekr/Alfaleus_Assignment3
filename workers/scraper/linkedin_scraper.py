"""
linkedin_scraper.py — Playwright headless Chromium scraper for LinkedIn public search.

NOTE: LinkedIn heavily throttles public search. This scraper:
  - Uses random user-agent rotation
  - Adds realistic human-like delays
  - Falls back gracefully when blocked (returns partial results)
  - Paginates up to 50 results (5 pages × 10 results)
"""
import os
import asyncio
import re
from typing import List, Optional
from pydantic import BaseModel
from fake_useragent import UserAgent
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

ua = UserAgent()


class LinkedInCandidate(BaseModel):
    name: str
    title: Optional[str] = None
    company: Optional[str] = None
    skills: List[str] = []
    profile_url: Optional[str] = None
    source: str = "linkedin"
    data_confidence: str = "medium"


def _clean_text(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    return re.sub(r"\s+", " ", text).strip()


async def _parse_people_cards(page) -> List[LinkedInCandidate]:
    """Parse people result cards from LinkedIn public search page."""
    candidates = []
    cards = await page.query_selector_all(".base-card")
    for card in cards:
        try:
            name_el = await card.query_selector(".base-search-card__title")
            title_el = await card.query_selector(".base-search-card__subtitle")
            company_el = await card.query_selector(".base-search-card__metadata")
            link_el = await card.query_selector("a.base-card__full-link")

            name = _clean_text(await name_el.inner_text() if name_el else None)
            title = _clean_text(await title_el.inner_text() if title_el else None)
            company = _clean_text(await company_el.inner_text() if company_el else None)
            href = await link_el.get_attribute("href") if link_el else None
            profile_url = href.split("?")[0] if href else None

            if name:
                candidates.append(LinkedInCandidate(
                    name=name,
                    title=title,
                    company=company,
                    profile_url=profile_url,
                    data_confidence="high" if (name and title and company) else "medium",
                ))
        except Exception:
            continue
    return candidates


import anthropic as _anthropic
import json as _json

async def _generate_ai_candidates(query: str, count: int = 8) -> List[LinkedInCandidate]:
    """
    When LinkedIn is unavailable, use Claude to generate realistic candidate
    profiles tuned to the actual job query. These are clearly marked as
    synthetic (data_confidence='synthetic') so the recruiter UI can badge them.
    """
    client = _anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""Generate {count} realistic but fictional candidate profiles for this job search query: "{query}"

Return ONLY a JSON array. No explanation, no markdown, no code fences.
Each object must have exactly these keys:
- "name": string (realistic full name, South Asian / global mix)
- "title": string (current job title matching the query level)
- "company": string (realistic Indian or global tech company name)
- "skills": array of 4-7 skill strings relevant to the query
- "profile_url": string (fake linkedin.com/in/slug URL)

Vary seniority, company size, and skill depth. Make profiles plausible for a real recruiter to evaluate."""

    message = client.messages.create(
        model="claude-3-5-haiku-20241022",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    try:
        profiles = _json.loads(raw)
    except _json.JSONDecodeError:
        # Fallback if Claude returns malformed JSON
        return []

    candidates = []
    for p in profiles:
        try:
            candidates.append(LinkedInCandidate(
                name=p["name"],
                title=p.get("title"),
                company=p.get("company"),
                skills=p.get("skills", []),
                profile_url=p.get("profile_url"),
                source="linkedin_ai_generated",
                data_confidence="synthetic",
            ))
        except Exception:
            continue

    return candidates


async def scrape_linkedin(query: str, max_results: int = 50) -> List[LinkedInCandidate]:
    """
    Scrape LinkedIn people search for the given query string.
    Returns up to max_results candidates.
    """
    results: List[LinkedInCandidate] = []
    url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                executable_path=os.getenv("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"),
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-blink-features=AutomationControlled",
                ]
            )
            context = await browser.new_context(
                user_agent=ua.random,
                viewport={"width": 1280, "height": 800},
                locale="en-US",
            )
            page = await context.new_page()

            # Mask automation fingerprints
            await page.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )

            page_num = 0
            while len(results) < max_results:
                paginated_url = f"{url}&start={page_num * 10}"
                try:
                    await page.goto(paginated_url, wait_until="networkidle", timeout=30000)
                    await asyncio.sleep(2)  # human-like delay
                except PlaywrightTimeout:
                    break

                # Check for LinkedIn auth wall
                if "authwall" in page.url or "login" in page.url:
                    print("LinkedIn auth wall hit — returning partial results")
                    break

                page_results = await _parse_people_cards(page)
                if not page_results:
                    break  # No more results

                results.extend(page_results)
                page_num += 1

                if page_num >= 5:  # Cap at 5 pages (50 results)
                    break

                await asyncio.sleep(1.5)  # rate limit courtesy

            await browser.close()
    except Exception as e:
        print(f"LinkedIn scraper error: {e}")

    if not results:
        print(f"LinkedIn blocked — generating AI candidates for: {query!r}")
        results = await _generate_ai_candidates(query, count=8)

    return results[:max_results]
