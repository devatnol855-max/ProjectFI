import requests
from bs4 import BeautifulSoup
import json

def parse_article(url, output_file="article.json"):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    # Заголовок статьи
    title_tag = soup.find("h1") or soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else "no title"

    # Дата публикации
    date_tag = soup.find("time")
    date = date_tag.get("datetime") if date_tag and date_tag.has_attr("datetime") else (
        date_tag.get_text(strip=True) if date_tag else "unknown"
    )

    # Основной текст статьи
    content_div = soup.find("div", class_="czr-wp-the-content")
    if content_div:
        # собираем абзацы и блоки текста
        blocks = content_div.find_all(["p", "div", "h2", "h3"])
        paragraphs = [block.get_text(" ", strip=True) for block in blocks if block.get_text(strip=True)]
    else:
        paragraphs = []

    article_data = {
        "title": title,
        "date": date,
        "paragraphs": paragraphs   # список абзацев
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(article_data, f, ensure_ascii=False, indent=4)

    print(f"Статья сохранена в {output_file}, абзацев: {len(paragraphs)}")


# пример вызова
parse_article("https://vitgtk.belstu.by/2025/05/15/oblost_tap/")
