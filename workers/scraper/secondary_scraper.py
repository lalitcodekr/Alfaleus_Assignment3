"""
secondary_scraper.py — GitHub Users API scraper.

Replaces the Naukri scraper (which requires auth for candidate profiles).
GitHub's public /search/users endpoint returns real developer profiles
with zero login required. Rate limit: 60/hr unauthenticated, 5000/hr
with GITHUB_TOKEN.

Data extracted per candidate:
  - name (display name or login fallback)
  - title (bio or "Software Developer" fallback)
  - company (company field or None)
  - skills (inferred from repos language — fetched per user)
  - profile_url (github.com/username)
  - source: "github"
  - data_confidence: "medium" (real data, but less structured than LinkedIn)
"""
import asyncio
import os
from typing import List, Optional
from pydantic import BaseModel
import httpx
from tenacity import retry, wait_exponential, stop_after_attempt

GITHUB_API = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")  # Optional — raises rate limit to 5000/hr


class SecondaryCandidate(BaseModel):
    name: str
    title: Optional[str] = None
    company: Optional[str] = None
    skills: List[str] = []
    profile_url: Optional[str] = None
    source: str = "github"
    data_confidence: str = "medium"


def _auth_headers() -> dict:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


@retry(wait=wait_exponential(min=2, max=30), stop=stop_after_attempt(3))
async def _github_get(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    resp = await client.get(url, headers=_auth_headers(), params=params, timeout=10)
    if resp.status_code == 403:
        raise RuntimeError("GitHub rate limit hit")
    resp.raise_for_status()
    return resp.json()


async def _get_top_languages(client: httpx.AsyncClient, username: str) -> List[str]:
    """Fetch top programming languages from a user's public repos."""
    try:
        repos = await _github_get(
            client,
            f"{GITHUB_API}/users/{username}/repos",
            params={"sort": "pushed", "per_page": 10, "type": "owner"},
        )
        lang_counts: dict[str, int] = {}
        for repo in repos:
            lang = repo.get("language")
            if lang:
                lang_counts[lang] = lang_counts.get(lang, 0) + 1
        # Return top 5 languages by repo count
        return [l for l, _ in sorted(lang_counts.items(), key=lambda x: -x[1])[:5]]
    except Exception:
        return []


async def scrape_github(query: str, max_results: int = 50) -> List[SecondaryCandidate]:
    """
    Search GitHub users matching the job query.
    Fetches profile + top languages per user.
    """
    results: List[SecondaryCandidate] = []

    # Build GitHub user search query from job query
    # e.g. "Senior React Engineer Bangalore" -> "react developer location:india"
    search_terms = query.lower()
    gh_query = f"{search_terms} type:user"

    async with httpx.AsyncClient() as client:
        page = 1
        while len(results) < max_results and page <= 5:
            try:
                data = await _github_get(
                    client,
                    f"{GITHUB_API}/search/users",
                    params={"q": gh_query, "per_page": 10, "page": page},
                )
            except Exception as e:
                print(f"GitHub search error page {page}: {e}")
                break

            items = data.get("items", [])
            if not items:
                break

            # Fetch full profile + languages concurrently for this page
            async def _enrich(item: dict) -> Optional[SecondaryCandidate]:
                login = item.get("login", "")
                try:
                    profile = await _github_get(client, f"{GITHUB_API}/users/{login}")
                    langs = await _get_top_languages(client, login)

                    display_name = profile.get("name") or login
                    bio = profile.get("bio") or "Software Developer"
                    company = (profile.get("company") or "").strip().lstrip("@") or None

                    return SecondaryCandidate(
                        name=display_name,
                        title=bio[:100] if bio else "Software Developer",
                        company=company,
                        skills=langs,
                        profile_url=f"https://github.com/{login}",
                        data_confidence="medium" if profile.get("name") else "low",
                    )
                except Exception:
                    return None

            enriched = await asyncio.gather(*[_enrich(item) for item in items])
            for cand in enriched:
                if cand and cand.name:
                    results.append(cand)

            page += 1
            await asyncio.sleep(1.0)  # respect GitHub rate limits

    return results[:max_results]


# Keep the original function name so main.py import doesn't break
async def scrape_naukri(query: str, max_results: int = 50) -> List[SecondaryCandidate]:
    """Alias — routes to GitHub scraper. Naukri requires auth; GitHub is public."""
    return await scrape_github(query, max_results=max_results)
