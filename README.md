# JSCalendar
The lightest Javascript calendar out there, without any dependency (no jQuery). 
This is a work in progress, so it is not ready to be used in production.

## Sailor's honour
This will be finished soon. It is needed for a bigger project anyways. If other kind developers want to lend a hand, I will obviously stop pushing directly to master and switch to a dev branch ;)

## Basic usage
```javascript 
var elem = document.getElementById("myCalendar");
var calendar = new JSCalendar(elem, { /* options */ }).init().render();
```

## Simple design and fast rendering
![demoscreenshot](http://erikdesjardins.com/static/git/jscalendar-ss.png "Screenshot of provided demo in example.html")

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
| height | Maximum height for the calendar, if it goes beyond, scroll bars are added | 700 |
| width | Maximum width for the calendar, if it goes beyond, the rest will be hidden. This can be a percentage. | 1024 |

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
| willFetch | Fired before sending a fetch request to a data source. |
| fetched | Fired after receiving data from the data source. |
| viewWillChange | Fired before rendering a new view (month, week, day). |
| viewChanged | Fired after changing view. This will not fire if the view was set to the current one (wasn't changed). |
