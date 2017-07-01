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

class JSCalendarEvent {
    constructor(data, calendar, position) {
        if (!data) { return false; }

        this.setData(data);
        this.position = position;
        this.options = calendar.options;
        this.calendar = calendar;
        this.buildElements();
        this.bindEvents();
    }

    setData(data) {
        this.at = data.at;
        this.duration = data.duration;
        this.displayname = data.displayname;
        this.color = data.color;
        this.html = data.html;
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

    buildElements() {
        let eMark = _a('div', 'cell-event-mark');

        if (this.at) {
            let dateText = this.formatTime(new Date(this.at));
            eMark.textContent = dateText;
        } 

        if (this.displayname) {
            let shortname = this.displayname.substring(0, this.options.titleCropSize);
            eMark.textContent += (this.at ? " - " : "") + shortname + 
                (shortname.length != this.displayname ? "..." : "");
        }

        eMark.style.background = this.color || this.options.eventBackground;

        this.monthElem = eMark;

        let eventCol = _a("div", "cal-week-day-event-col");

        if (this.displayname) {
            eventCol.classList.add("text-injected");
            eventCol.textContent = this.displayname;
        } else if (this.html) {
            eventCol.innerHTML = this.html;
            eventCol.classList.add("html-injected");
        } else {
            eventCol.classList.add("not-injected");
            eventCol.textContent = this.options.nonameEventVocab;
        }

        eventCol.style.background = this.color || this.options.eventBackground;

        !this.at && eventCol.classList.add("no-starting-time");
        !this.duration && eventCol.classList.add("no-duration");

        if (this.at) {
            // In case field is a timestamp represented as a string
            let type = typeof this.at;
            if (type == "string" && !isNaN(this.at)) {
                this.at = parseInt(this.at);
                type = typeof this.at;  // Should be "number", but won't hardcode
            }

            let outputString;
            switch (type) {
                case "number": 
                case "string": 
                    let moment = new Date(this.at);
                    outputString = this.formatTime(moment);

                    if (this.duration) {
                        let end = new Date(moment.getTime() + this.duration);
                        outputString += " - " + this.formatTime(end);
                    }
                    break;

                case "object": // Date object
                    outputString = this.formatTime(this.at);
                    if (this.duration) {
                        let end = new Date(this.at.getTime() + this.duration);
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
        this.weekElem = eventCol;
    }

    dragging() {
        this.monthElem.classList.add('dragged');
        this.weekElem.classList.add('dragged');
        this.calendar.dragging(this);
    }

    dropped() {
        this.monthElem.classList.remove('dragged');
        this.weekElem.classList.remove('dragged');
        this.calendar.dropped(this);
    }

    bindEvents() {
        this.monthElem && this.monthElem.addEventListener('mousedown', () => {
            let finish = () => {
                window.removeEventListener('mouseup', finish);
                this.dropped();
            };
            window.addEventListener('mouseup', finish);
            
            this.dragging();
        });

        this.weekElem && this.weekElem.addEventListener('mousedown', () => {
            let finish = () => {
                window.removeEventListener('mouseup', finish);
                this.dropped();
            };
            window.addEventListener('mouseup', finish);
            
            this.dragging();
        });
    }

    render(view, container) {
        container.appendChild(this[view + "Elem"]);
    }

    destroy() {
        this.monthElem && this.monthElem.remove();
        this.weekElem && this.weekElem.remove();
        this.dayElem && this.dayElem.remove();

        this.monthElem = undefined;
        this.weekElem = undefined;
        this.dayElem = undefined;
    }
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
                this.setView(v);
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
            this.state.day = this.state.day - (this.state.day % 7);

            if (this.state.day <= 0) {
                this.state.month--;
                if (this.state.month == -1) {
                    this.state.month = 11;
                    this.state.year--;
                }

                let monthStat = JSCalendar.getDaysInMonth(this.state.year, this.state.month)
                this.state.day = monthStat.numberOfDays + this.state.day;
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

    push(item) {
        this.fire('willPush', item);
        let date = new Date(item.at);

        if (date.getMonth() == this.state.month && date.getFullYear() == this.state.year) {
            let monthStat = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
            let startAt = monthStat.firstDay;

            let index = date.getDate() + startAt - 1;
            let row = Math.floor(index / 7);
            let col = index % 7;

            let arr = this.state.matrix[row][col];
            if (!arr) {
                arr = [];
                this.state.matrix[row][col] = arr;
            }

            arr.push(item);
            this.render();

            this.fire('pushed', item);
        } else {
            this.fire("didNotPush", item);
        }

        return this;
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
        if (this.state.matrix) {
            this.state.matrix.forEach(row => {
                row.forEach(col => {
                    if (col && col.length) {
                        col.forEach(ev => {
                            ev.destroy();
                        });
                    }
                });
            }); 
        }

        delete this.elem;
        delete this.tablewrapper;
        delete this.controlbar;
        delete this.table;

        delete _jsCalWrapper[this.id];

        return this;
    }

    setView(view) {
        this.fire('viewWillChange');
        if (this.state.view != view) {
            this.state.view = view;
            this.render();
            this.fire('viewChanged');
        }
    }

    render() {
        this.fire("willRender");
        log("Rendering instance " + this.id);
        let benchStart = Date.now();

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

            log(`Rendering benchmark : ${Date.now()-benchStart}ms`);
        });

        return this;
    }

    renderDay() {
        
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

            let daycontainer = _a('div', "col-week-day-container", daycol);
            if (this.state.matrix[row][i] && this.state.matrix[row][i].length !== 0) {
                let events = this.state.matrix[row][i];
                for (let j = 0; j < events.length; j++) {
                    let event = events[j];
                    event.render(this.state.view, daycontainer);
                }
            }

            daycontainer.dataset.row = row;
            daycontainer.dataset.col = i;
            daycontainer.addEventListener('mouseenter', () => {
                if (this.state.dragging) {
                    daycontainer.appendChild(this.state.dragged.weekElem);
                    this.state.newPosition = [daycontainer.dataset.row, daycontainer.dataset.col];
                }
            });

            let eventCol = _a("div", "cal-week-day-no-event-col", daycontainer);
            eventCol.textContent = this.options.emptyDayVocab;

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
                        events[k].render(this.state.view, td);
                    }
                }

                td.dataset.row = row;
                td.dataset.col = col;

                td.addEventListener('mouseenter', () => {
                    if (this.state.dragging) {
                        td.appendChild(this.state.dragged.monthElem);
                        this.state.newPosition = [td.dataset.row, td.dataset.col];
                    }
                });
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
            cols[i].style.width  = (this.options.width  / 7) + "px";
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

    moveCell(ev) {
        let oldPos = ev.position;
        let newPos = this.state.newPosition;

        this.fire('cellMightMove', ev);
        if (newPos && (oldPos[0] != newPos[0] || oldPos[1] != newPos[1])) {
            this.fire('cellWillMove', {event : ev, oldPosition : oldPos, newPosition : newPos});
            let dayCell = this.state.matrix[oldPos[0]][oldPos[1]];
            let index = dayCell ? dayCell.indexOf(ev) : -1;

            if (index != -1) {
                dayCell.splice(index, 1);
                let arr = this.state.matrix[newPos[0]][newPos[1]];
                arr = arr || [];
                this.state.matrix[newPos[0]][newPos[1]] = arr;
                arr.push(ev);

                ev.position = newPos;
                this.fire('cellMoved', {event : ev, oldPosition : oldPos, newPosition : newPos});
            } else {
                this.fire('cellDidNotMove', {event : ev, reason : new Error("Could not find cell in matrix")});
            }
        } else {
            this.fire('cellDidNotMove', {event : ev, reason : new Error("Position did not change")});
        }
    }

    dragging(ev) {
        this.fire('dragging', ev);
        this.state.dragging = true;
        this.state.dragged = ev;
        this.state.newPosition = undefined;
        this.elem.classList.add("dragging");
    }

    dropped(ev) {
        this.fire('dropped', ev);
        this.moveCell(ev);

        this.state.dragging = false;
        this.state.dragged = undefined;
        this.elem.classList.remove("dragging");
    }

    preloadMatrix(matrix, year, month) {
        this.state.matrices[year + "-" + month] = matrix;
    }

    setMatrix(matrix, rerender) {
        log("Setting new matrix to instance " + this.id);
        this.fire('matrixWillSet');
        if (!matrix) {
            matrix = JSCalendar.defaultMatrix();
        }

        if (matrix.length == 6) {
            this.state.matrix = matrix;
            for (let row = 0; row < matrix.length; row++) {
                for (let col = 0; col < matrix[row].length; col++) {
                    if (this.state.matrix[row][col]) {
                        let arr = [];
                        for (let k = 0; k < this.state.matrix[row][col].length; k++) {
                            arr.push(new JSCalendarEvent(this.state.matrix[row][col][k], this, [row, col]));
                        }
                        this.state.matrix[row][col] = arr;
                    } else {
                        this.state.matrix[row][col] = [];
                    }
                }
            }
        } else if (matrix.length > 27) {
            let startAt = JSCalendar.getDaysInMonth(this.state.year, this.state.month).firstDay;
            let newMatrix = JSCalendar.defaultMatrix();
            let index = -1;
            for (let i = 0; i < newMatrix.length; i++) {
                index++;
                for (let j = (!i?startAt:0); j < 7; i++) {
                    newMatrix[i][j] = [];
                    if (matrix[index] && matrix[index].length) {
                        for (let k = 0; k < matrix[index].length; k++) {
                            newMatrix[i][j].push(new JSCalendarEvent(matrix[index], this, [i, j]));
                        }
                    }
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

                newMatrix[row][col] = [];
                if (matrix[daystr] && matrix[daystr].length) {
                    for (let k = 0; k < matrix[daystr].length; k++) {
                        newMatrix[row][col].push(new JSCalendarEvent(matrix[daystr][k], this, [row, col]));
                    }
                }
            }

            this.state.matrix = newMatrix;
        } else {
            return false;
        }

        log("No problem setting new matrix to instance " + this.id);
        this.fire('matrixSet');
        this.state.matrixmonth = this.state.month;
        this.state.matrices[this.state.year + "-" + this.state.month] = this.state.matrix;
        rerender && this.render();
        return this;
    }

    debug() {
        let matrix = [];

        for (let i = 0; i < this.state.matrix.length; i++) {
            let row = [];
            for (let j = 0; j < this.state.matrix[i].length; j++) {
                let obj = false;
                if (this.state.matrix[i][j]) {
                    obj = [];
                    for (let k = 0; k < this.state.matrix[i][j].length; k++) {
                        obj.push({
                            displayname : this.state.matrix[i][j][k].displayname,
                            at : this.state.matrix[i][j][k].at,
                            duration : this.state.matrix[i][j][k].duration
                        });
                    }
                }

                row.push(obj);
            }

            matrix.push(row);
        }

        return {
            year : this.state.year,
            month : this.state.month,
            day : this.state.day,
            weekday : this.state.weekday,
            view : this.state.view,
            matrix
        };
    }

    fetch(done, force) {
        if (!force && this.state.matrices[this.state.year + "-" + this.state.month]) {
            log("Loading matrix from local cache");
            this.state.matrix = this.state.matrices[this.state.year + "-" + this.state.month];
            done && done();
        } else if (this.options.datasource) {
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

                        if (this.setMatrix(maybeMatrix)) {
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
            this.setMatrix(JSCalendar.defaultMatrix());
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
            matrices    : {},
            
            year        : now.getFullYear(),
            month       : now.getMonth(),   // has array padding, 0 is January
            day         : now.getDate(),    
            weekday     : now.getDay(),     // has array padding, 0 is Sunday

            dragging    : false
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
            titleCropSize : 20,
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
