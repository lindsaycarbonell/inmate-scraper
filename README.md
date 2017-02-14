# inmate-scraper

## What the Client Wants
I'm interested in these tasks/questions:
- I'd like to scrape regularly and remove duplicates to create a table derived from "Last 30 Days" that spans a longer time period.
- What is the distribution of bail bond amounts for those who bonded out in the past 30 days? (Charged and then released).
- What is the distribution of bail bond amounts for those currently incarcerated that have been in jail for more than 3 days?
  - (this can be implemented in the Google Sheet)

In general, I'm looking to **identify people in the extremes**, that is, people who couldn't get out of jail despite low bond amounts, and people who were released despite high bond amounts.

## My thoughts
Ideally, I'd like to have this scraper automatically go to a google sheet that has some functions written in for the client to run at their leisure.

That would mean:
- figuring out the selectors for what I want to scrape
- storing that info in a delimited format
- updating records in a google sheet via the Google Sheets API.

Smaller implementation:
- can do the calculations that the client needs in a new field of their choice
- just make sure that each CSV has the date it was exported in the file name
