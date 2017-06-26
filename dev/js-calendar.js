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
        } else if (this.state.view == "year") {
            this.state.year--;
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
        } else if (this.state.view == "year") {
            this.state.year++;
        }

        this.render();
    }

    on(event, callback) {
        this.hooks[event] = this.hooks[event] || [];
        this.hooks[event].push(callback);
    }

    fire(event, extra) {
        log(`Firing event '${event}'`);
        JSCalendar.fire(event, this, extra);

        let events = this.hooks[event] || [];
        events.forEach(e => {
            e(this, extra);
        });
    }

    destroy() {
        delete this.elem;
        delete this.tablewrapper;
        delete this.controlbar;
        delete this.table;

        delete _jsCalWrapper[this.id];
    }

    render() {
        this.fire("willRender");
        log("Rendering instance " + this.id);

        this.fetch(() => {
            JSCalendar.emptyElem(this.table);
            switch (this.state.view) {
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
        if (matrix.length == 6) {
            this.state.matrix = matrix;
        } else if (matrix.length == 1) {
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
                let index = parseInt(daystr) + startAt;
                let row = index % 6;
                let col = index % 7;

                newMatrix[row][col] = matrix[daystr];
            }

            this.state.matrix = newMatrix;
        } else {
            return false;
        }

        log("No problem setting new matrix to instance " + this.id);
        this.fire('matrixSet');
        rerender && this.render();
        return true;
    }

    fetch(done) {
        if (this.options.datasource) {
            this.fire('willFetch');
            let request = new XMLHttpRequest();
            for (let header in this.options.datasourceHeaders) {
                request.setRequestHeader(header, this.options.datasourceHeaders[header]);
            }

            let url = this.options.datasource;
            url += (url.indexOf('?') != -1 ? "&" : "?") + "year=" + this.state.year + "&month=" + this.state.month +
                "&day=" + this.state.day + "&view=" + this.state.view;


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
            view    : "month",
            matrix  : JSCalendar.defaultMatrix(),
            year    : now.getFullYear(),
            month   : now.getMonth(), // array padding
            day     : now.getDate(),
            weekday : now.getDay()  // array padding, 0 is Sunday
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
            globalSelector : ".js-calendar",
            datasource : "",
            datasourceHeaders : {},
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
