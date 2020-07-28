const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const User = require('./models/user');

const DB_URI = process.env.DB_URI;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_PASSWORD = process.env.GITHUB_PASSWORD;
const GITHUB_SEARCH_USERS = process.env.GITHUB_SEARCH_USERS

if (process.env.GITHUB_USER === undefined  || process.env.GITHUB_PASSWORD === undefined || GITHUB_SEARCH_USERS === undefined || process.env.DB_URI === undefined)
  console.log('\nPlease set all the environment variables GITHUB_USER & GITHUB_PASSWORD & GITHUB_SEARCH_USERS  & DB_URI \n')
let userToSearch = GITHUB_SEARCH_USERS.split(" ");
let strSearch = "";

for(let i=0 ; i < userToSearch.length ; i++)
{
	if(i===0)
	{
		strSearch+="fullname:" +userToSearch[i];
	}
	else
	{
		strSearch+="+fullname:" +userToSearch[i];
	}
}

let searchUrl = `https://github.com/search?q=${strSearch}&type=Users&utf8=%E2%9C%93`;
console.log('Search url  -->  ' + searchUrl+ '\n')
console.log('MongoDB uri --> '+ DB_URI + '\n');


async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    devtools: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox"
      ]
//    defaultViewport: 0
  });
  const browserVersion = await browser.version();
  console.log(`Started ${browserVersion}\n`);
  
  const page = await browser.newPage();
  await page.goto('https://github.com/login');
  const title = await page.title();
  console.info(`${title}`);
  page.waitForSelector()

  

  // dom element selectors
  const USERNAME_SELECTOR = '#login_field';
  const PASSWORD_SELECTOR = '#password';
  const BUTTON_SELECTOR = '#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block';

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(GITHUB_USER);

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(GITHUB_PASSWORD);

  await page.click(BUTTON_SELECTOR).catch();
  await page.waitForNavigation({ waitUntil: 'load' });

  await page.$eval('body.env-production.logged-in', heading => heading.innerText);

  await page.goto(searchUrl);
  await page.waitFor(3 * 1000);

  const LIST_USERNAME_SELECTOR = '#user_search_results > div.user-list > div:nth-child(INDEX) > div.flex-shrink-0.mr-2 > a.d-table';
  const LIST_EMAIL_SELECTOR = '#user_search_results > div.user-list > div:nth-child(INDEX) > div.flex-auto > div.d-flex.flex-wrap.text-small.text-gray'
  const LENGTH_SELECTOR_CLASS = 'user-list-item';

  const numPages = await getNumPages(page);

  console.log('Numpages: ', numPages);

  for (let h = 1; h <= numPages; h++) {
    let pageUrl = searchUrl + '&p=' + h;
    await page.goto(pageUrl);

    let listLength = await page.evaluate((sel) => {
      return document.getElementsByClassName(sel).length;
    }, LENGTH_SELECTOR_CLASS);

    for (let i = 1; i <= listLength; i++) {
//      change the index to the next child
      let usernameSelector = LIST_USERNAME_SELECTOR.replace("INDEX", i);
      let emailSelector = LIST_EMAIL_SELECTOR.replace("INDEX", i);
      let username = await page.evaluate((sel) => {        
        return document.querySelector(sel).getAttribute('href').replace('/', '');
      }, usernameSelector);
      
      let email = await page.evaluate((sel) => {

        let element = document.querySelector('a.muted-link');
        return element ? element.innerHTML : null;
      }, emailSelector);
      // not all users have emails visible
      if (!email) {
        continue;
      };
      if (mongoose.connection.readyState == 1) {
        console.log('\n' + username, ' -> ', email + '\n');
      };
      upsertUser({
        username: username,
        email: email,
        dateCrawled: new Date()
      });
    }
  }
  browser.close();
  if (mongoose.connection.readyState == 1) { console.log('\nJob finished successfully');}
  if (mongoose.connection.readyState == 0) { console.log('\nJob finished without writing results to mongoDB');}
  mongoose.disconnect();
}

async function getNumPages(page) {
  const NUM_USER_SELECTOR = '#js-pjax-container > div > div.col-12.col-md-9.float-left.px-2.pt-3.pt-md-0.codesearch-results > div > div.d-flex.flex-column.flex-md-row.flex-justify-between.border-bottom.pb-3.position-relative > h3';
  let inner = await page.evaluate((sel) => {
  
  if (document.querySelector(sel) != null)
    // format is: "69,803 users"
    return document.querySelector(sel).innerHTML.replace(',', '').replace('users', '').trim();
  else
    console.log('no results')
  }, NUM_USER_SELECTOR);

  const numUsers = parseInt(inner);

  console.log('numUsers: ', numUsers);
  /**
   * GitHub shows 10 resuls per page, so
   */
  return Math.ceil(numUsers / 10);
}
function upsertUser(userObj) {
  if (mongoose.connection.readyState == 0) {
    mongoose.set('useFindAndModify', false);
    var db = mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      poolSize: 10,
      socketTimeoutMS: 30000
    }).catch(err => console.log(err.reason));
  }

  // if this email exists, update the entry, don't insert
  const conditions = { email: userObj.email };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  User.findOneAndUpdate(conditions, userObj, options, (err, result) => {
    if (err) {
      console.log(err)
      throw err;
    }
      else {console.log(result);}      
  });  
}
run();
