Now i want to consider columns the things that happen there.  For example   column wise how long does  a sumdigit take to be in column 1 or column 2 the first or second drawed number for the draw.  I want column data for all filters and groups. I want to know how long its been since a number has showed up in a column.  I want to know the sum of the column skips/draws out. Now we can do this by keeping the existing pages and then proceeding to add a new page for columns.  This page will have all the data for columns.  I want to be able to filter by group and filter by filters.  I want to be able to see the data for each column.  I want to see the sum of the column skips/draws out.  I want to see the average of the column skips/draws out.  I want to see the max of the column skips/draws out.  I want to see the min of the column skips/draws out.  I want to see the standard deviation of the column skips/draws out.  I want to see the variance of the column skips/draws out.  I want to see the median of the column skips/draws out.  I want to see the mode of the column skips/draws out.  I want to see the range of the column skips/draws out.  I want to see the count of the column skips/draws out.  I want to see the frequency of the column skips/draws out.  I want to see the percentage of the column skips/draws out.  I want to see the histogram of the column skips/draws out.  I want to see the box plot of the column skips/draws out.  I want to see the scatter plot of the column skips/draws out.  I want to see the line chart of the column skips/draws out.  I want to see the bar chart of the column skips/draws out.  I want to see the pie chart of the column skips/draws out.  I want to see all this data in a single page for easy access and analysis.  
Or we can do this where we click a button on the current pages and we are able to navigate to the column section for that pair. 

We have to refactor all scoring and analysis because column data should be able to factor in here. 

E how long has it been since it showed up in column 1 , 2 ,3, 4, 5?  how long since an even powerball number we defintely need a powerball analysis page to break down the various filters that is done on the other numbers on the powerball itself.   

Make sure a scoring sytem for the powerball is created so we can measure which ball is likely are we getting in the top 5 consistently?  How are we doing? I want to see how accurate we can become with this information. 

some numbers naturally will not be in some columns based on the numbere but that is okay its understandable.  a 7 in the 5th column may not show up  often as there are only a few combinations that have it. and a 4 is never possible. But still we should know 

how long its been since even or odd showed up in a column (consider all 5)
how long its been since high or low showed up in a column (consider all 5)
how long its been since a prime or non prime showed up in a column (consider all 5)
how long its been since a sumdigit showed up in a column (consider all 5)
how long its been since a consecutive number showed up in a column (consider all 5)
how long its been since a number showed up in a column (consider all 5)
how long its been since a lastDigit showed up in a column (consider all 5)
how long its been since a firstDigit showed up in a column (consider all 5)
how long its been since a divisionNumber showed up in a column (consider all 5)

We also want to consider the following alot of the times things flip naturally even odd even odd high low high low etc.  But we want to see how long its been since a pattern has shown up in a column. We want to see if we can predict based on this information. At least whether or not its going to be an even or odd or high low.  

We need to start by writing a plan for these additions and then from there we can proceed to implement them.

Checklist of steps to implement everything outlined above. rough draft of steps need to add everything from above. 

1. Refactor the existing scoring and analysis system to accommodate column data.
2. Create a new page dedicated to column analysis, accessible via a button on existing pages.
3. Implement functions to calculate the time since each number or pattern has appeared in each column.
4. Develop a scoring system for the Powerball number, similar to the main numbers.
5. Design and implement visualizations (charts, graphs) to represent the column data effectively.
6. Test the new features thoroughly to ensure accuracy and usability.
Unit Tests
7

1. Test the refactored scoring and analysis functions to ensure they correctly incorporate column data.
2. Verify that the new column analysis page displays accurate data for each column.
3. Test the functions calculating the time since each number or pattern appeared in each column.
4. Validate the Powerball scoring system to ensure it functions similarly to the main numbers.
5. Ensure all visualizations accurately represent the underlying data.
7. Conduct user testing to gather feedback on the new features and make necessary adjustments.
Do not assume test is incorrect it maybe the way we implemented it. We want to make sure we have good test coverage for all new and refactored code.

