import requests, datetime, time

cookies = {
    '_ga': 'GA1.2.411439502.1492649680',
    'files_key': 'jsuj7vzOmYJjEZjYY+o3emH/39h8HtWaR3osqVDLims=',
    'csrftoken': 'yByZHbQirYY3cXitD43VgebiHZV073tfXKOMGJMfFXgNOGFwouHdbm7dclkfnnbZ',
    'sessionid': 'pgks5hmbbrv7nccvu8225vugmftm8xv0',
}

headers = {
    'Origin': 'https://ion.tjhsst.edu',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': '*/*',
    'Referer': 'https://ion.tjhsst.edu/eighth/signup/3379',
    'X-CSRFToken': 'yByZHbQirYY3cXitD43VgebiHZV073tfXKOMGJMfFXgNOGFwouHdbm7dclkfnnbZ',
    'X-Requested-With': 'XMLHttpRequest',
    'Connection': 'keep-alive',
}

data = [
  ('uid', '34682'),
  ('bid', '3379'),
  ('aid', '563'),
]

while True:
    r = requests.post('https://ion.tjhsst.edu/eighth/signup', headers=headers, cookies=cookies, data=data)
    print(r.text)
    print(datetime.datetime.now().time())
    time.sleep(1);
