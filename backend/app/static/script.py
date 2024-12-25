from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
import requests
import io
from PIL import Image
import time
import pandas as pd
import urllib.parse
import concurrent.futures

def setup_driver(chromedriver_path):
    service = Service(chromedriver_path)
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    driver = webdriver.Chrome(service=service, options=options)
    return driver

def get_images_from_google(driver, delay, max_images, movie_name):
    def scroll_down(driver):
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(delay)

    
    encoded_movie_name = urllib.parse.quote(movie_name)
    url = f"https://www.google.com/search?q={encoded_movie_name}%20netflix&tbm=isch"
    driver.get(url)
    
    image_urls = set()
    skips = 0
    
    while len(image_urls) + skips < max_images:
        scroll_down(driver)
        
        thumbnails = driver.find_elements(By.CLASS_NAME, "H8Rx8c")
        
        for img in thumbnails[len(image_urls) + skips:max_images]:
            try:
                ActionChains(driver).move_to_element(img).click().perform()
                time.sleep(delay)
            except:
                continue

            divs = driver.find_elements(By.CLASS_NAME, "YsLeY")
            
            for div in divs:
                image = div.find_elements(By.TAG_NAME, 'img')[0]
                attr = image.get_attribute('src')
                
                if attr in image_urls:
                    max_images += 1
                    skips += 1
                    break

                if attr and 'http' in attr:
                    image_urls.add(attr)
    
    return list(image_urls)

def download_image(download_path, url, file_name):
    try:
        image_content = requests.get(url).content
        image_file = io.BytesIO(image_content)
        image = Image.open(image_file)
        file_path = download_path + file_name

        with open(file_path, "wb") as f:
            image.save(f, "JPEG")

        print(f"Downloaded {file_name} successfully")
    except Exception as e:
        print(f"FAILED to download {file_name} -", e)

def download_images_for_titles(titles):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = []
        
        
        for title in titles:
            futures.append(executor.submit(download_image_for_title, title))
        
        
        concurrent.futures.wait(futures)

def download_image_for_title(title):
    driver = setup_driver('backend/app/static/chromedriver')
    image_urls = get_images_from_google(driver, 1, 3, title)  

    
    for i, url in enumerate(image_urls):
        download_image("imgs/", url, f"{title}_{i}.jpg")
    
    driver.quit()  


df = pd.read_csv('backend/app/data/netflix_titles.csv')
titles = df.title.tolist()


download_images_for_titles(titles)
