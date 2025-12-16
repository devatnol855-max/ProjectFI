import requests
from bs4 import BeautifulSoup
import json
import re

def parse_gallery(url, output_file="photos.json"):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    photos_data = []

    # регулярка для поиска формата типа 150x150, 300x200 и т.п.
    size_pattern = re.compile(r"\d+x\d+")

    for tag in soup.find_all(["img", "a"]):
        # проверяем, что тег не находится внутри блока "post-related-articles czr-carousel"
        if tag.find_parent("div", class_="post-related-articles czr-carousel"):
            continue

        # проверяем, что у тега есть атрибут data-lb-type="grouped-gallery"
        if tag.get("data-lb-type") != "grouped-gallery":
            continue

        link = tag.get("href") or tag.get("data-original") or tag.get("data-src") or tag.get("src")

        if link and link.lower().endswith(".jpg"):
            # проверяем, что в ссылке нет формата (150x150 и т.п.)
            if not size_pattern.search(link):
                photos_data.append({
                    "src": link
                })

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(photos_data, f, ensure_ascii=False, indent=4)

    print(f"Сохранено {len(photos_data)} jpg-файлов без формата и с data-lb-type='grouped-gallery' в {output_file}")


# пример вызова
parse_gallery("https://vitgtk.belstu.by/2025/05/15/oblost_tap/")
