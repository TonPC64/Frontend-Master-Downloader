# Frontend-Master-Downloader
Scrape frontendmaster with puppeteer (Not fully working for now, just try it for fun)

# Try it

Checkout the repo then install it

```
npm install
```
Use the command by doing

```
   node index.js COURSE_NAME LOGIN PASSWORD DIRECTORY
```
Directory is the only argument optionnal, if not provided, the script will create a Download direcory in the current location.

# Example

```
 node index.js leveldb-crypto sepiropht mypassword

```
# Issues

I never succeded to fetch all the video from a course. I'm very close but no cigar. But puppeter(a wrapper for chrome headless) crash, if you have suggestion to fix please share !
