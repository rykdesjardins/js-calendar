var log = function(msg) {
    console.log(`[JSCalendar - ${new Date().toLocaleTimeString()}] ${msg}`);
};

_jsCalWrapper = {
    instances : {}
};

var _a = function(tag, classes, parentElem) {
    let elem = document.createElement(tag);
    elem.className = classes || "";
    parentElem && parentElem.appendChild(elem);
    return elem;
}

class JSCalendar {
    constructor(elem, options) {
        this.elem = elem;
        this.id = elem.id;
        this.options = Object.assign(JSCalendar.defaultOptions, options || { defaultOptions : true });
        this.state = JSCalendar.createState();
        this.hooks = {};

        this.fire("new");
    }

    init(done) {
        log("Created new instance with id : " + this.id);
        this.fire('init');
        this.createStructure();

        return this.options.datasource ? this.fetch(done) : this.render();
    }

    createStructure() {
        JSCalendar.emptyElem(this.elem);
        this.elem.classList.add("js-calendar");

        this.controlbar = _a('div', "control-bar", this.elem);
        this.tablewrapper = _a('div', "calendar-wrapper", this.elem);
        this.table = _a('table', "calendar-table", this.tablewrapper);

        this.viewcontroller     = _a('div', 'control-bar-widget control-bar-views', this.controlbar);
        this.actioncontroller   = _a('div', 'control-bar-widget control-bar-actions', this.controlbar);
        this.titlecontroller    = _a('div', 'control-bar-widget control-bar-title', this.controlbar);

        this.options.views.forEach(v => {
            let word = this.options.viewsVocab[v] || v;
            let button = _a('button', 'control-button change-view change-view-' + v, this.viewcontroller);
            button.addEventListener('click', () => {
                this.state.view = v;
                this.render();
            });
            button.textContent = word;
        });

        this.options.buttons.forEach(b => {
            let word = this.options.buttonsVocab[b] || b;
            let button = _a('button', 'control-button calendar-action calendar-action-' + b, this.actioncontroller);
            let action = this.options.buttonsActions[b];
            button.addEventListener('click', () => {
                if (typeof action == "function") {
                    action(this);
                } else {
                    this[action]();
                }
            });
            button.textContent = word;
        });
    }

    goNow() {
        let now = new Date();
        this.state.year = now.getFullYear();
        this.state.month = now.getMonth();
        this.state.day = now.getDate();
        this.state.weekday = now.getDay();

        this.state.view = "month";
        this.render();
    }

    goBack() {
        if (this.state.view == "day") {
            this.state.day--;

            if (this.state.day == 0) {
                this.state.month--;
                if (this.state.month == 0) {
                    this.state.month = 11;
                    this.state.year--;
                }

                let monthStat = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
                this.state.day = monthStat.numberOfDays;
            }
        } else if (this.state.view == "month") {
            this.state.month--;
            if (this.state.month < 0) {
                this.state.month = 11;
                this.state.year--;
            }
        } else if (this.state.view == "week") {
            this.state.day -= 7;
            if (this.state.day < 0) {
                this.state.month--;
                if (this.state.month == -1) {
                    this.state.month = 11;
                    this.state.year--;
                }

                let monthStat = JSCalendar.getDaysInMonth(this.state.year, this.state.month)
                this.state.day = monthStat.numberOfDays;
            }
        }

        this.render();
    }

    goNext() {
        if (this.state.view == "day") {
            let monthStat = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
            this.state.day++;

            if (this.state.day > monthStat.numberOfDays) {
                this.state.day = 1;
                this.state.month++;

                if (this.state.month > 11) {
                    this.state.month = 0;
                    this.state.year++;
                }
            }
        } else if (this.state.view == "month") {
            this.state.month++;
            if (this.state.month > 11) {
                this.state.month = 0;
                this.state.year++;
            }
        } else if (this.state.view == "week") {
            let monthStat = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
            this.state.day += 7;
            if (this.state.day > monthStat.numberOfDays) {
                this.state.month++;
                if (this.state.month == 12) {
                    this.state.month = 0;
                    this.state.year++;
                }

                this.state.day = this.state.day - monthStat.numberOfDays;
            }
        }

        this.render();
    }

    on(event, callback) {
        this.hooks[event] = this.hooks[event] || [];
        this.hooks[event].push(callback);

        return this;
    }

    fire(event, extra) {
        log(`Firing event '${event}'`);
        JSCalendar.fire(event, this, extra);

        let events = this.hooks[event] || [];
        events.forEach(e => {
            e(this, extra);
        });

        return this;
    }

    destroy() {
        delete this.elem;
        delete this.tablewrapper;
        delete this.controlbar;
        delete this.table;

        delete _jsCalWrapper[this.id];

        return this;
    }

    render() {
        this.fire("willRender");
        log("Rendering instance " + this.id);

        this.fetch(() => {
            JSCalendar.emptyElem(this.table);
            switch (this.state.view) {
                case "day":
                    this.renderDay();
                    break;

                case "week":
                    this.renderWeek();
                    break;

                case "month":
                default:
                    this.renderMonth();
            }

            this.applyCSS();
            this.updateControls();
            this.fire("rendered");
        });

        return this;
    }

    renderDay() {
        
    }

    formatTime(t) {
        let h = t.getHours();
        let m = t.getMinutes();
        let s = t.getSeconds();

        let append = "";
        if (this.options.ampm) {
            if (h > 11) {
                h -= 12;
                append = " PM";
            } else {
                append = " AM";
            }
        } 

        return h + (m < 10 ? ":0" : ":") + m + (this.displaySeconds ? ((s < 10 ? ":0" : ":") + s) : "") + append;
    }

    renderWeek() {
        const daystamp = 1000 * 60 * 60 * 24;

        let dayrow = _a("tr", "cal-week-day-row", this.table);
        let daycol = _a("td", "cal-week-day-col", dayrow);

        let month = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
        let dayObj = new Date(this.state.year, this.state.month, this.state.day);
        let firstDay = new Date(dayObj.getTime() - (dayObj.getDay() * daystamp));
        let lastDay = new Date(firstDay.getTime() + (6 * daystamp));

        let cDay = new Date(firstDay.getTime());
        let row = Math.ceil(firstDay.getDate() / 7)
        log("Rending matrix row number " + row);
        for (let i = 0; i < 7; i++) {

            let daysep = _a('div', "cal-week-day-sep", daycol);
            daysep.textContent = this.options.daysVocab[cDay.getDay()] + ", " +
                this.options.monthsVocab[cDay.getMonth()] + " " + cDay.getDate();

            if (this.state.matrix[row][i] && this.state.matrix[row][i].length !== 0) {
                let events = this.state.matrix[row][i];
                for (let j = 0; j < events.length; j++) {
                    let event = events[j]
                    let eventCol = _a("div", "cal-week-day-event-col", daycol);

                    if (event.displayname) {
                        eventCol.classList.add("text-injected");
                        eventCol.textContent = event.displayname;
                    } else if (event.html) {
                        eventCol.innerHTML = event.html;
                        eventCol.classList.add("html-injected");
                    } else {
                        eventCol.classList.add("not-injected");
                        eventCol.textContent = this.options.nonameEventVocab;
                    }

                    eventCol.style.background = event.color || this.options.eventBackground;

                    !event.at && eventCol.classList.add("no-starting-time");
                    !event.duration && eventCol.classList.add("no-duration");

                    if (event.at) {
                        // In case field is a timestamp represented as a string
                        let type = typeof event.at;
                        if (type == "string" && !isNaN(event.at)) {
                            event.at = parseInt(event.at);
                            type = typeof event.at;  // Should be "number", but won't hardcode
                        }

                        let outputString;
                        switch (type) {
                            case "number": 
                            case "string": 
                                let moment = new Date(event.at);
                                outputString = this.formatTime(moment);

                                if (event.duration) {
                                    let end = new Date(moment.getTime() + event.duration);
                                    outputString += " - " + this.formatTime(end);
                                }
                                break;

                            case "object": // Date object
                                outputString = this.formatTime(event.at);
                                if (event.duration) {
                                    let end = new Date(event.at.getTime() + event.duration);
                                    outputString += " - " + this.formatTime(end);
                                }
                                break;

                            default:
                                break;
                        }

                        if (outputString) {
                            let timefloat = _a('span', 'cal-week-day-time-float', eventCol);
                            timefloat.textContent = outputString;
                        }
                    }
                }
            } else {
                let eventCol = _a("div", "cal-week-day-no-event-col", daycol);

                eventCol.textContent = this.options.emptyDayVocab;
            }

            cDay = new Date(cDay.getTime() + daystamp);
        }

        if (firstDay.getMonth() == lastDay.getMonth()) {
            this.titlecontroller.textContent = this.options.monthsVocab[firstDay.getMonth()] + " " + 
                firstDay.getDate() + " - " + lastDay.getDate() + ", " + this.state.year;

        } else if (firstDay.getYear() == lastDay.getYear()) {
            this.titlecontroller.textContent = 
                this.options.monthsVocab[firstDay.getMonth()] + " " + firstDay.getDate() + " - " +
                this.options.monthsVocab[lastDay.getMonth()] + " " + lastDay.getDate() + ", " + 
                this.state.year;

        } else {
            this.titlecontroller.textContent = 
                this.options.monthsVocab[firstDay.getMonth()] + " " + firstDay.getDate() + ", " + 
                firstDay.getFullYear() + " - " + 
                this.options.monthsVocab[lastDay.getMonth()] + " " + lastDay.getDate() + ", " + 
                lastDay.getFullYear();
        }

    }

    renderMonth() {
        let month = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
        let startAt = -month.firstDay;
        let totalDays = month.numberOfDays;

        let now = new Date();
        let isCurrentMonth = now.getMonth() == this.state.month && now.getFullYear() == this.state.year;
        let currentDay = now.getDate();

        let titleRow = _a('tr', "jscal-weekday-row", this.table);
        for (let day = 0; day < this.options.daysVocab.length; day++) {
            let td = _a('td', "js-cal-weekday", titleRow);
            td.textContent = this.options.daysVocab[day];
        }

        for (let row = 0; row < this.state.matrix.length; row++) {
            let tr = _a('tr', "jscal-row row" + row, this.table);

            for (let col = 0; col < this.state.matrix[row].length; col++) {
                let td = _a('td', 'jscal-col row' + row + "col" + col, tr);
                if (++startAt <= 0 || startAt > totalDays) {
                    td.classList.add("notinmonth");
                } else {
                    let daySpan = _a('span', 'cell-number', td);
                    daySpan.textContent = startAt;
                }

                isCurrentMonth && currentDay == startAt && td.classList.add("cell-today");
                tr.appendChild(td);

                let events = this.state.matrix[row][col];
                if (events) {
                    for (let k = 0; k < events.length; k++) {
                        let eMark = _a('div', 'cell-event-mark', td);

                        if (events[k].at) {
                            let dateText = this.formatTime(new Date(events[k].at));
                            eMark.textContent = dateText;
                        } else {
                            eMark.textContent = this.options.noDate;
                        }

                        if (events[k].displayname) {
                            let shortname = events[k].displayname.substring(0, 20);
                            eMark.textContent += " - " + shortname + 
                                (shortname.length != events[k].displayname ? "..." : "");
                            eMark.style.background = events[k].color || this.options.eventBackground;
                        }
                    }
                }
            }
        }

        this.titlecontroller.textContent = this.options.monthsVocab[this.state.month] + " " + this.state.year;
    }

    updateControls() {
        let oldState = this.controlbar.querySelector(".active");
        oldState && oldState.classList.remove("active");

        let button = this.controlbar.querySelector(".change-view-" + this.state.view);
        button && button.classList.add('active');
    }

    applyCSS() {
        this.elem.style.width = this.options.width + "px";

        let cols = this.elem.querySelectorAll(".jscal-col");
        for (let i = 0; i < cols.length; i++) {
            cols[i].style.height = (this.options.height / 6) + "px";
            cols[i].style.width  = (this.options.width / 7) + "px";
        }

        this.elem.querySelector('.calendar-wrapper').style.maxHeight = (this.options.height + 40) + "px";
    }

    setDate(year, month, day, rerender) {
        this.state.year = year;
        this.state.month = month;
        this.state.day = day;
        this.state.weekday = new Date(year, month, day).getDay();

        rerender && this.render();
    }

    setMatrix(matrix, rerender) {
        log("Setting new matrix to instance " + this.id);
        this.fire('matrixWillSet');
        if (!matrix) {
            matrix = JSCalendar.defaultMatrix();
        }

        if (matrix.length == 6) {
            this.state.matrix = matrix;
        } else if (matrix.length > 27) {
            let startAt = JSCalendar.getDaysInMonth(this.state.year, this.state.month).firstDay;
            let newMatrix = JSCalendar.defaultMatrix();
            let index = -1;
            for (var i = 0; i < newMatrix.length; i++) {
                index++;
                for (var j = (!i?startAt:0); j < 7; i++) {
                    newMatrix[i][j] = matrix[index];
                }
            }

            this.state.matrix = newMatrix;
        } else if (typeof matrix == "object" && !Array.isArray(matrix)) {
            let startAt = JSCalendar.getDaysInMonth(this.state.year, this.state.month).firstDay;
            let newMatrix = JSCalendar.defaultMatrix();
            for (let daystr in matrix) if (!isNaN(daystr)) {
                let index = parseInt(daystr) + startAt - 1;
                let row = Math.floor(index / 7);
                let col = index % 7;

                newMatrix[row][col] = matrix[daystr];
            }

            this.state.matrix = newMatrix;
        } else {
            return false;
        }

        log("No problem setting new matrix to instance " + this.id);
        this.fire('matrixSet');
        this.state.matrixmonth = this.state.month;
        rerender && this.render();
        return true;
    }

    fetch(done, force) {
        if (!force || this.state.month == this.state.matrixmonth) {
            log("No need to fetch from data source");
            return done && done(new Error("Same month, no need to update from server"));
        }

        if (this.options.datasource) {
            this.fire('willFetch');
            let request = new XMLHttpRequest();
            for (let header in this.options.datasourceHeaders) {
                request.setRequestHeader(header, this.options.datasourceHeaders[header]);
            }

            const daystamp = 1000 * 60 * 60 * 24;
            let dim = JSCalendar.getDaysInMonth(this.state.year, this.state.month);

            let from = new Date(this.state.year, this.state.month, 1);
            let to = new Date(this.state.year, this.state.month, dim.numberOfDays);

            let firstStamp = from.getTime() - (from.getDay() * daystamp);
            let endStamp = to.getTime() + ((6 - to.getDay()) * daystamp) + daystamp - 1;

            let url = this.options.datasource;
            url += (url.indexOf('?') != -1 ? "&" : "?") + "year=" + this.state.year + "&month=" + this.state.month +
                "&day=" + this.state.day + "&view=" + this.state.view + 
                "&startstamp=" + firstStamp + "&endstamp=" + endStamp;

            request.onreadystatechange = () => {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    try {
                        let maybeMatrix = JSON.parse(request.responseText);
                        this.fire('fetched', maybeMatrix);

                        if (this.setMatrix(maybeMatrix, true)) {
                            log("Updated matrix from data source")
                            done && done(undefined, maybeMatrix);
                        } else {
                            log("Received invalid matrix with size : " + maybeMatrix.length)
                            done && done(new Error("Invalid matrix size"), maybeMatrix);
                        }
                    } catch (err) {
                        log("Caught error during matrix parsing : " + err);
                        done && done(err);
                    }
                } else if (request.status && request.status != 200) {
                    log("Received non-200 HTTP response code : " + request.status);
                    done && done(new Error("Non-200 HTTP response code : " + request.status), request.status);
                }
            };

            log("Sending async request to data source : " + this.options.datasource);
            request.open('GET', url);
            request.send();
        } else {
            done && done(new Error("Invalid datasource"));
        }

        return this;
    }

    // https://stackoverflow.com/questions/4881938/javascript-calculate-number-of-days-in-month-for-a-given-year
    // Credit to : Matti Virkkunen
    static getDaysInMonth(year, month) {
        let isLeap = ((year % 4) == 0 && ((year % 100) != 0 || (year % 400) == 0));
        return {
            numberOfDays : [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month],
            firstDay : new Date(year, month).getDay()
        };
    }

    static on(event, callback) {
        JSCalendar.hooks[event] = JSCalendar.hooks[event] || [];
        JSCalendar.hooks[event].push(callback);
    }

    static fire(event, instance, extra) {
        let events = JSCalendar.hooks[event] || [];
        events.forEach(e => {
            e(instance, extra);
        });
    }

    static emptyElem(elem) {
        if (elem) while (elem.firstElementChild) {
            elem.firstElementChild.remove();
        }
    }

    static defaultMatrix() {
        return [ 
            // Sun  Mon    Tue    Wed    Thu    Fri    Sat
            [false, false, false, false, false, false, false], 
            [false, false, false, false, false, false, false], 
            [false, false, false, false, false, false, false], 
            [false, false, false, false, false, false, false], 
            [false, false, false, false, false, false, false], 
            [false, false, false, false, false, false, false]
        ];
    }

    static createState() {
        let now = new Date();
        return {
            view        : "month",
            matrix      : JSCalendar.defaultMatrix(),
            matrixmonth : now.getMonth(),
            year        : now.getFullYear(),
            month       : now.getMonth(), // array padding
            day         : now.getDate(),
            weekday     : now.getDay()  // array padding, 0 is Sunday
        };
    }

    static getInstance(id) {
        return _jsCalWrapper.instances[id];
    }

    static get defaultOptions() {
        return {
            views : ["day", "week", "month"],
            viewsVocab : {
                day : "Day",
                week : "Week",
                month : "Month"
            },
            buttons : ["previous", "today", "next"],
            buttonsActions : {
                previous : "goBack",
                today : "goNow",
                next : "goNext"
            },
            buttonsVocab : {
                previous : "<",
                today : "Today",
                next : ">"
            },
            monthsVocab : [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ],
            daysVocab : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            nthVocab : {
                1 : "st",
                2 : "nd",
                3 : "rd",
                default : "th"
            },
            emptyDayVocab : "Nothing here.",
            noDate : "Somewhen",
            nonameEventVocab : "Event without a name",
            globalSelector : ".js-calendar",
            eventBackground : "rgb(126, 156, 193)",
            datasource : "",
            datasourceHeaders : {},
            ampm : true,
            displaySeconds : false,
            height : 700,
            width : 1024
        };
    }

    static find(wrapper) {
        let calendarElems = (wrapper || document)["querySelectorAll"](JSCalendar.defaultOptions.globalSelector);
        for (let i = 0; i < calendarElems.length; i++) {
            let elem = calendarElems[i]
            let id = elem.id || ("js-calendar-" + i);
            _jsCalWrapper.instances[id] = new JSCalendar(elem).init();
        }

        return JSCalendar;
    }
}
JSCalendar.hooks = {};
