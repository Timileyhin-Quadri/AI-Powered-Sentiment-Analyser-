# !pip install webdriver-manager


import pandas as pd
import time 
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By


import warnings
warnings.filterwarnings("ignore")


if __name__ == "__main__":
    # create driver 
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    # Go to the characters page in the url 
    page_url = "https://witcher.fandom.com/wiki/Category:Characters_in_the_stories"
    driver.get(page_url)
    time.sleep(5)
    book_categories=driver.find_elements(By.CLASS_NAME,"category-page__member-link")
    books=[]
    for category in book_categories:
        book_url=book_categories[0].get_attribute("href")
        book_name=category.text
        books.append({'book_name': book_name, 'book_url': book_url})

    character_lists=[]
    for book in books:
        driver.get(book['book_url'])
        character_elems = driver.find_elements(By.CLASS_NAME,"category-page__member-link")
        for elems in character_elems:
            character_lists.append({'book': book['book_name'], 'character': elems.text})

    pd.DataFrame(character_lists).to_csv("characters.csv",index=False)
    driver.quit()

