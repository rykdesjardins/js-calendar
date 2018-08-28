# JSCalendar
The lightest Javascript calendar out there, without any dependency (no jQuery). This is a work in progress, but it is ready to be used in production.

The development files are using es2016, so I used babel with the es2015 preset and babily to minify the whole thing. Distribution files can be found under `./dist/`. There are both normal and minified files. 

## Sailor's honour
If other kind developers want to lend a hand, I will obviously stop pushing directly to master and switch to a dev branch ;)

EDIT : This now has a dev branch. Thanks to @jamacon36, I will probably be maintaining this library again. 

## Installation
### Using git 
`git clone https://github.com/rykdesjardins/js-calendar`

### Using NPM 
`npm install --save vanilla-js-calendar`

### Using bower 
`bower install --save vanilla-js-calendar`

## Basic usage
```javascript 
var elem = document.getElementById("myCalendar");
var calendar = new JSCalendar(elem, { /* options */ }).init().render();
```

# Imported Usage
```javascript
import * as LibName from "vanilla-js-calendar"

var elem = document.getElementById("myCalendar");
var JSCalendar = LibName.JSCalendar;
var JSCalendarEvent = LibName.JSCalendarEvent;
var calendar = new JSCalendar(elem, { /* options */ }).init().render();
```

## Latest tag
1.0.10

## Simple design and fast rendering
![demoscreenshot](https://erikdesjardins.com/static/git/jscalendar-ss-month.jpg "Screenshot of provided demo in example.html")

## Options
| Option name | Usage | Default |
| ----------- | ----- | ------- |
| views | Array of available views | ["day", "week", "month"] |
| viewsVocab | Object of words used to represent the views { view : "display name" } | {day : "Day", week : "Week", month : "Month" } |
| buttons | Available buttons in the top control bar | ["previous", "today", "next"] |
| buttonsActions | JSCalendar function, or user-defined function object for top buttons { action : "functionName" \|\| function } | { previous : "goBack", today : "goNow", next : "goNext" } |
| buttonsVocab | Object of words used to represent the buttons { action : "display name" } | {previous : "<", today : "Today", next : ">"} |
| monthsVocab | Array of display names for every months | ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] |
| daysVocab | Array of display names for every week day | ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] |
| emptyDayVocab | Display phrase when no event is found for a partical day | "Nothing here." |
| noDate | Word used when an event has no time at a certain date | "Somewhen" |
| nonameEventVocab | Words used when an event does not have a name | "Event without a name" |
| globalSelector | Query Selector used to search for JSCalendars in the DOM | ".js-calendar" |
| eventBackground | Default event background color | "rgb(126, 156, 193)" |
| titleCropSize | Number of letter max for events in the month view | 20 |
| datasource | URL used to request matrix data | "" |
| datasourceHeaders | Headers to be sent to the data source on every request | {} |
| ampm | Flag, setting it to true will use 12h system, false will use 24h | true |
| displaySeconds | Flag, setting it to true will display the seconds for the events in the calendar | false |
| dayviewGapMinutes | Number of minutes between each block in day view | 30 |
| dayviewNoTimeGapSize | Number of block used in day view for events without a time | 2 |
| alwaysFetch | Wether to always fetch from server or not | false |
| fetchReplaces | Wether to replace the entire matrix after fetching, false for append | false |
| dayviewGapHeight | Height of a block in day view, in pixels | 38 |
| height | Maximum height for the calendar, if it goes beyond, scroll bars are added | 700 |
| width | Maximum width for the calendar, if it goes beyond, the rest will be hidden. Can also be "full" for responsive full width. | 1024 |

## Hooks
Hooks can be used to customize certain events and alter the way data is fetched, processed and rendered. 

```javascript
// Hooks on a specific instance
var calendarInstance = new JSCalendar(elem);
calendarInstance.on('eventName', (calendar, extra) => {
    // calendar is the current calendar instance
    // extra contains various data depending on the event
});

// Hooks on all instances
JSCalendar.on('eventName', (calendar, extra) => {
    // Arguments are the same as above
});
```

| Hook name | Context |
| --------- | ------- |
| new | Fired when a JSCalendar object is built using the default constructor. |
| init | Fired when the initialization logic is being processed for a newly built object. Fired before the DOM structure is created. | 
| willPush | Fired before adding an item to the calendar dynamically. |
| pushed | Fired after adding an item to the calendar dynamically. |
| didNotPush | Fired after failing to add an item to the calendar dynamically. |
| willRender | Fired before rendering the calendar, also before fetching data from the data source if specified. |
| rendered | Fired after the render logic was processed. |
| dragging | Fired when an event is grabbed and ready to be moved around. |
| dropped | Fired when an event is dropped, the event cellMightMove will be triggered right after this one. |
| cellMightMove | Fired when a cell movement is validated. |
| cellMoved | Fired after an event was moved from a cell to another. |
| cellDidNotMoved | Fired when a cell could have moved, but the validation failed or the event was dropped onto its original cell. |
| matrixWillSet | Fired when a matrix is sent to replace the current one in the calendar's state. |
| matrixSet | Fired after a matrix was set as the current matrix state. |
| matrixWillAppend | Fired when another matrix is about to be inserted into the current matrix state |
| matrixAppended | Fired after another matrix was inserted into the current matrix state |
| willFetch | Fired before sending a fetch request to a data source. |
| fetched | Fired after receiving data from the data source. |
| viewWillChange | Fired before rendering a new view (month, week, day). |
| viewChanged | Fired after changing view. This will not fire if the view was set to the current one (wasn't changed). |

## Static functions
Those can be called using the class directly
```javascript
// Will instanciate all calendars found under a certain wrapper
JSCalendar.find(document.getElementById("calendar-area"));

// Will return an instance of a calendar automatically generated using JSCalendar.find()
JSCalendar.getInstance(instanceid);

// Fires an event to all calendars from a specified instance
JSCalendar.fire(event, instance, extra);

/* 
    Returns an object : 
    { 
        numberOfDays : number,  // Total number of days in the month
        firstDay : number       // Week day of the 1st of the month
    }
*/
JSCalendar.getDaysInMonth(year, month);
```

## Instance functions
Associated with all JSCalendar instanciated objects. Chainable functions return "this" so you can chain multiple functions on one line.
```javascript
// Must be called after instanciating [chainable]
calendar.init(callback)

// Previous, today, next [chainable]
// Those are called when pressing the direction buttons on the top bar. 
// The calendar will be rendered at the end
calendar.goBack();
calendar.goNow();
calendar.goNext();

// Adding an item to the matrix [chainable]
/*
    The first parameter is an object : 
    {
        at : Date,
        event : JSCalendarEventTemplate { 
            at : Date, 
            displayname : string, 
            duration : number,  
            color : string
        }
    }
*/
calendar.push(event);

// Destroy calendar reference [chainable]
calendar.destroy();

// Switch from current view to another [chainable]
/*
    First parameter is on of the following strings : 
        month
        week
        day
*/
calendar.setView(view);

// Refresh and rebuild current view [chainable]
calendar.render();

// Merge a new matrix into the current state matrix [chainable]
/*
    A matrix is an object formatted like the following :
    matrix[year][month][day] = [JSCalendarEventTemplate];
    
    The second parameter is a flag (true|false). If true, 
    the calendar will render after setting the new matrix
*/
calendar.appendMatrix(matrix, rerender);

// Set the current state matrix, and destroy the old one if any [chainable]
calendar.setMatrix(matrix, rerender);

// If a data source is specified, fetch a new matrix to append [chainable]
/*
    This will request to the data source specified with query parameters
    like the following : 
    year = current state year
    month = current state month
    day = current state day
    
    Once finished, the provided callback will be executed
    The second parameter is a flag (true|false), if set to true, will
    fetch even is a cached version of the matrix exists.
*/
calendar.fetch(callback, force);
```

## More screenshots

### No conflicts with overlapping events
![demoscreenshot](https://erikdesjardins.com/static/git/jscalendar-ss-day.jpg "Screenshot of provided demo in example.html")

### Week view
![demoscreenshot](https://erikdesjardins.com/static/git/jscalendar-ss-week.jpg "Screenshot of provided demo in example.html")

