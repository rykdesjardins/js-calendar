# js-calendar
Light, responsive calendar

Work in progress, not ready to be used in production.

## Hooks
+ new
Fired when a JSCalendar object is built using the default constructor.
 
+ init 
Fired when the initialization logic is being processed for a newly built object. Fired before the DOM structure is created. 

+ willPush
Fired before adding an item to the calendar dynamically.

+ pushed
Fired after adding an item to the calendar dynamically.

+ didNotPush
Fired after failing to add an item to the calendar dynamically.

+ willRender
Fired before rendering the calendar, also before fetching data from the data source if specified.

+ rendered
Fired after the render logic was processed.

+ dragging
Fired when an event is grabbed and ready to be moved around.

+ dropped
Fired when an event is dropped, the event cellMightMove will be triggered right after this one.

+ cellMightMove
Fired when a cell movement is validated.

+ cellMoved
Fired after an event was moved from a cell to another.

+ cellDidNotMoved
Fired when a cell could have moved, but the validation failed or the event was dropped onto its original cell.

+ matrixWillSet
Fired when a matrix is sent to replace the current one in the calendar's state.

+ matrixSet 
Fired after a matrix was set as the current matrix state.

+ willFetch
Fired before sending a fetch request to a data source.

+ fetched
Fired after receiving data from the data source.

+ viewWillChange
Fired before rendering a new view (month, week, day).

+ viewChanged
Fired after changing view. This will not fire if the view was set to the current one (wasn't changed).
