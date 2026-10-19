
import json
import os
import sys

import requests


def main():
    base_url = os.getenv("TEST_API_BASE_URL", "http://localhost:8000")
    repository_id = os.getenv("TEST_REPOSITORY_ID")
    user_id = os.getenv("TEST_USER_ID")
    secret = os.getenv("INTERNAL_API_SECRET")

    if not all([repository_id, user_id, secret]):
        sys.exit(
            "Set TEST_REPOSITORY_ID, TEST_USER_ID, and "
            "INTERNAL_API_SECRET before running this script."
        )

    url = (
        f"{base_url.rstrip('/')}/api/v1/repositories/"
        f"{repository_id}/chat/stream"
    )

    headers = {
        "X-Internal-Api-Secret": secret,
        "X-User-Id": user_id,
        "Content-Type": "application/json",
    }

    payload = {
        "query": "Explain the main architecture of this repository.",
        "limit": 5,
    }

    with requests.post(
        url,
        headers=headers,
        json=payload,
        stream=True,
        timeout=(10, 180),
    ) as response:
        print("HTTP status:", response.status_code)
        response.raise_for_status()

        for line in response.iter_lines(decode_unicode=True):
            if line:
                print(line, flush=True)


if __name__ == "__main__":
    main()
