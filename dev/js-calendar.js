const _jscallog = function (msg) {
    console.log(`[JSCalendar - ${new Date().toLocaleTimeString()}] ${msg}`);
};

const _jsCalWrapper = {
    instances: {}
};

const _a = function (tag, classes, parentElem) {
    let elem = document.createElement(tag);
    elem.className = classes || "";
    parentElem && parentElem.appendChild(elem);
    return elem;
}

class JSCalendarEvent {
    constructor(data, calendar, position) {
        if (!data) { return false; }

        this.setData(data);
        this.setID(data.id);
        this.position = position;
        this.options = calendar.options;
        this.calendar = calendar;
        this.buildElements();
        this.updateElements();
        this.bindEvents();
    }

    setID(id) {
        this.id = id;
    }

    getID() {
        return this.id;
    }

    setData(data) {
        this.at = data.at && new Date(data.at);
        this.duration = data.duration;
        this.displayname = data.displayname;
        this.color = data.color;
        this.html = data.html;
    }

    formatDuration(d, append = "", prepend = "") {
        if (!d) {
            return "";
        }

        d = Math.floor(d / 1000 / 60);

        let h = Math.floor(d / 60);
        let m = d % 60;

        return append + (h ? (h + "h ") : "") + (m ? (m + "mins") : "") + prepend;
    }

    formatTime(t) {
        let h = t.getHours();
        let m = t.getMinutes();
        let s = t.getSeconds();

        let append = "";
        if (this.options.ampm) {
            if (h > 11) {
                h -= h == 12 ? 0 : 12;
                append = " PM";
            } else {
                append = " AM";
            }
        }

        return h + (m < 10 ? ":0" : ":") + m + (this.displaySeconds ? ((s < 10 ? ":0" : ":") + s) : "") + append;
    }

    buildElements() {
        this.monthElem = _a('div', 'cell-event-mark');
        this.weekElem = _a("div", "cal-week-day-event-col");
        this.dayElem = _a("div", "cal-total-day-event-view");
    }

    updateElements() {
        let monthElem = this.monthElem;
        let weekElem = this.weekElem;
        let dayElem = this.dayElem;

        // Month element
        if (this.at) {
            let dateText = this.formatTime(new Date(this.at));
            monthElem.textContent = dateText;
            monthElem.dataset.at = this.at;
        }

        if (this.displayname) {
            let shortname = this.displayname.substring(0, this.options.titleCropSize);
            monthElem.textContent += (this.at ? " - " : "") + shortname +
                (shortname.length != this.displayname ? "..." : "");
        }

        monthElem.style.background = this.color || this.options.eventBackground;

        // Week element
        if (this.displayname) {
            weekElem.classList.add("text-injected");
            weekElem.textContent = this.displayname;
        } else if (this.html) {
            weekElem.innerHTML = this.html;
            weekElem.classList.add("html-injected");
        } else {
            weekElem.classList.add("not-injected");
            weekElem.textContent = this.options.nonameEventVocab;
        }

        weekElem.style.background = this.color || this.options.eventBackground;

        !this.at && weekElem.classList.add("no-starting-time");
        !this.duration && weekElem.classList.add("no-duration");

        if (this.at) {
            let outputString;
            outputString = this.formatTime(this.at);
            if (this.duration) {
                let end = new Date(this.at.getTime() + this.duration);
                outputString += " - " + this.formatTime(end);
            }

            let timefloat = weekElem.querySelector(".cal-week-day-time-float") || _a('span', 'cal-week-day-time-float', weekElem);
            timefloat.textContent = outputString;
        }

        // Day element
        let gapMinuteSize = this.options.dayviewGapMinutes;
        let gapsPerHour = 60 / gapMinuteSize;

        this.gapcell = -1;
        if (this.at) {
            this.gapcell = (this.at.getHours() * gapsPerHour) + (this.at.getMinutes() / gapMinuteSize);
        } else {
            dayElem.classList.add("no-time");
        }

        this.gapcount = this.options.dayviewNoTimeGapSize;
        if (this.duration) {
            this.gapcount = Math.ceil(this.duration / 1000 / 60 / gapMinuteSize);
        } else {
            dayElem.classList.add("no-duration");
        }

        dayElem.style.background = this.color || this.options.eventBackground;
        dayElem.style.height = this.gapcount * this.options.dayviewGapHeight - 2 + "px";

        if (this.at) {
            this.daytop = this.gapcell * this.options.dayviewGapHeight;

            dayElem.style.top = this.daytop + "px";
            dayElem.style.right = "0px";
            dayElem.style.left = "0px";
            dayElem.style.zIndex = Math.floor(this.gapcell);
        }

        let dayText = dayElem.querySelector(".cal-total-day-displayname") || _a('div', 'cal-total-day-displayname', dayElem);
        dayText.textContent = this.displayname || this.options.nonameEventVocab;

        if (this.at) {
            let timeText = dayElem.querySelector(".cal-total-day-time") || _a('div', 'cal-total-day-time', dayElem);
            timeText.textContent = this.formatTime(new Date(this.at)) + (this.formatDuration(this.duration, ', '));
        }

    }

    getDayGap() {
        return this.gapcell;
    }

    dragging() {
        this.monthElem.classList.add('dragged');
        this.weekElem.classList.add('dragged');
        this.dayElem.classList.add('dragged');
        this.calendar.dragging(this);
    }

    dropped() {
        this.monthElem.classList.remove('dragged');
        this.weekElem.classList.remove('dragged');
        this.dayElem.classList.remove('dragged');
        this.calendar.dropped(this);
    }

    bindEvents() {
        this.monthElem.addEventListener('mousedown', () => {
            let finish = () => {
                window.removeEventListener('mouseup', finish);
                this.dropped();
            };
            window.addEventListener('mouseup', finish);

            this.dragging();
        });

        this.weekElem.addEventListener('mousedown', () => {
            let finish = () => {
                window.removeEventListener('mouseup', finish);
                this.dropped();
            };
            window.addEventListener('mouseup', finish);

            this.dragging();
        });

        this.dayElem.addEventListener('mousedown', (ev) => {
            let finish = () => {
                window.removeEventListener('mouseup', finish);
                this.dropped();
            };
            window.addEventListener('mouseup', finish);

            this.originalY = ev.y;
            this.potentialnewtop = this.daytop;
            this.dragging();
        });

        this.monthElem.addEventListener('click', () => {
            this.calendar.fire("click", this);
        });

        this.weekElem.addEventListener('click', () => {
            this.calendar.fire("click", this);
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
        this.options = Object.assign(JSCalendar.defaultOptions, options || { defaultOptions: true });
        this.state = JSCalendar.createState();
        this.hooks = {};

        if (Math.floor(60 / this.options.dayviewGapMinutes) != (60 / this.options.dayviewGapMinutes)) {
            throw new Error("Option dayviewGapMinutes must be a divisor of 60");
        }

        this.fire("new");
    }

    init(done) {
        _jscallog("Created new instance with id : " + this.id);
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

        this.viewcontroller = _a('div', 'control-bar-widget control-bar-views', this.controlbar);
        this.actioncontroller = _a('div', 'control-bar-widget control-bar-actions', this.controlbar);
        this.titlecontroller = _a('div', 'control-bar-widget control-bar-title', this.controlbar);

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
        this.adjustDateToView();

        return this.render();
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

        return this.render();
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

        return this.render();
    }

    goToDay(position) {
        let date = position.split('-');
        date = new Date(date[0], date[1], date[2]);

        this.state.year = date.getFullYear();
        this.state.month = date.getMonth();
        this.state.day = date.getDate();
        this.setView("day");
    }

    push(item) {
        this.fire('willPush', item);

        if (item.at) {
            let date = new Date(item.at);
            this.validateCell(date.getFullYear(), date.getMonth(), date.getDate());
            this.state.matrix[date.getFullYear()][date.getMonth()][date.getDate()].push(
                new JSCalendarEvent(
                    item.event, this, date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate()
                )
            );

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
        _jscallog(`Firing event '${event}'`);
        JSCalendar.fire(event, this, extra);

        let events = this.hooks[event] || [];
        events.forEach(e => {
            e(this, extra);
        });

        return this;
    }

    destroy() {
        for (let year in this.state.matrix) {
            for (let month in this.state.matrix[year]) {
                for (let day in this.state.matrix[year][month]) {
                    for (let i = 0; i < this.state.matrix[year][month][day].length; i++) {
                        this.state.matrix[year][month][day][i].destroy();
                    }
                }
            }
        }

        delete this.elem;
        delete this.tablewrapper;
        delete this.controlbar;
        delete this.table;

        delete _jsCalWrapper[this.id];

        return this;
    }

    adjustDateToView() {
        if (this.state.view == "week" && this.state.weekday != this.state.day && this.state.day < 8) {
            this.state.month--;
            this.state.day = JSCalendar.getDaysInMonth(this.state.year, this.state.month).numberOfDays;
        }
    }

    getDateAppendee(d = this.state.day) {
        if (d > 3 && d < 21) {
            return this.options.nthVocab.default;
        }

        return this.options.nthVocab[d.toString().slice(-1)] || this.options.nthVocab.default;
    }

    setView(view) {
        this.fire('viewWillChange');
        if (this.state.view != view) {
            this.state.view = view;
            this.adjustDateToView();
            this.render();
            this.fire('viewChanged');
        }

        return this;
    }

    render() {
        this.fire("willRender");
        _jscallog("Rendering instance " + this.id);
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

            _jscallog(`Rendering benchmark : ${Date.now() - benchStart}ms`);
        }, this.options.alwaysFetch);

        return this;
    }

    renderDay() {
        this.titlecontroller.textContent = this.options.monthsVocab[this.state.month] + " " +
            this.state.day + this.getDateAppendee() + ", " + this.state.year;

        let dayrow = _a("tr", "cal-week-day-row", this.table);
        let daycol = _a("td", "cal-week-day-col", dayrow);

        this.validateCell();
        let events = this.state.matrix[this.state.year][this.state.month][this.state.day];
        let noTimeWrap = _a('div', 'single-day-no-time-wrap', daycol);
        let timetable = _a('div', 'single-day-time-table', daycol);
        let eventwrap = _a('div', 'cal-total-day-event-wrap', timetable);

        events.filter(e => !e.at).forEach(e => {
            e.render(this.state.view, noTimeWrap);
        });

        eventwrap.addEventListener('mousemove', (ev) => {
            if (this.state.dragging) {
                let top = this.state.dragged.daytop - (this.state.dragged.originalY - ev.y);
                this.state.dragged.dayElem.style.top = top + "px";
                this.state.dragged.potentialnewtop = top;
            }
        });

        // Loop through hours
        let minGap = this.options.dayviewGapMinutes;
        let gapsPerHour = Math.ceil(60 / minGap);
        let gapindex = 0;
        for (let h = 0; h < 24; h++) {
            for (let gapi = 0; gapi < gapsPerHour; gapi++) {
                let minutesBlock = _a('div', 'hour-block gap-' + (++gapindex), timetable);
                let timespan = _a('span', 'minutes-block-time', minutesBlock);

                minutesBlock.classList.add(gapi == 0 ? "hour-gap" : "minutes-gap")

                let mins = gapi * minGap;
                let dh = h;
                let appendee = "";
                minutesBlock.style.height = (this.options.dayviewGapHeight - 1) + "px";
                if (this.options.ampm) {
                    if (h < 12) {
                        appendee = "AM";
                    } else {
                        dh -= dh == 12 ? 0 : 12;
                        appendee = "PM";
                    }
                }
                timespan.textContent = dh + ":" + (mins < 10 ? "0" : "") + mins + appendee;

                minutesBlock.dataset.gapindex = gapindex;
            }
        }

        let groups = {};
        let smallestGap = -1;
        events.filter(e => e.at).forEach(e => {
            e.render(this.state.view, eventwrap);
            e.ratio = 100;
            e.dayElem.style.left = "0";
            e.dayElem.style.right = "0";

            let totalgaps = e.gapcount;
            if (Math.floor(e.gapcell) != e.gapcell) {
                totalgaps++;
            }

            for (let i = 0; i < totalgaps; i++) {
                let g = Math.floor(e.gapcell + i)
                if (!groups[g]) {
                    groups[g] = [];
                }

                groups[g].push(e);
            }

            if (smallestGap == -1 || smallestGap > e.gapcell) {
                smallestGap = e.gapcell;
            }
        });

        for (let gap in groups) {
            let total = groups[gap].length;
            let ratio = 100 / total;
            let index = 0;

            groups[gap].forEach(e => {
                let minleft = index * ratio;
                let minright = ratio * (total - index - 1);

                if (ratio < e.ratio) {
                    e.ratio = ratio;
                    e.dayElem.style.left = minleft + "%";
                    e.dayElem.style.right = minright + "%";
                }

                index++;
            });
        }

        if (this.state.skipscroll) {
            this.state.skipscroll = false;
        } else {
            this.tablewrapper.scrollTop = smallestGap * this.options.dayviewGapHeight;
        }
    }

    renderWeek() {
        const daystamp = 1000 * 60 * 60 * 24;

        let dayrow = _a("tr", "cal-week-day-row", this.table);
        let daycol = _a("td", "cal-week-day-col", dayrow);

        let month = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
        let dayObj = new Date(this.state.year, this.state.month, this.state.day);
        let firstDay = new Date(dayObj.getTime() - (dayObj.getDay() * daystamp));
        let lastDay = new Date(firstDay.getTime() + (6 * daystamp));

        this.validateCell(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate());
        this.validateCell(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());

        _jscallog("Rending matrix week");
        let cDay = new Date(firstDay.getTime());
        for (let i = 0; i < 7; i++) {
            let y = cDay.getFullYear();
            let m = cDay.getMonth();
            let d = cDay.getDate();
            let w = cDay.getDay();
            let t = cDay.getTime();

            let daysep = _a('div', "cal-week-day-sep", daycol);
            daysep.textContent = this.options.daysVocab[w] + ", " +
                this.options.monthsVocab[m] + " " + d;

            let daycontainer = _a('div', "col-week-day-container", daycol);
            if (this.state.matrix[y][m][d]) {
                let events = this.state.matrix[y][m][d];
                for (let j = 0; j < events.length; j++) {
                    let event = events[j];
                    event.render(this.state.view, daycontainer);
                }
            }

            let fulldate = y + "-" + m + "-" + d;
            daycontainer.dataset.fulldate = fulldate;
            daycontainer.dataset.at = cDay.getTime();
            daycontainer.addEventListener('mouseenter', () => {
                if (this.state.dragging) {
                    daycontainer.appendChild(this.state.dragged.weekElem);
                    this.state.newPosition = fulldate;
                    this.state.newAt = cDay.getTime();
                }
            });

            daysep.addEventListener('click', () => {
                this.goToDay(fulldate);
            });

            let eventCol = _a("div", "cal-week-day-no-event-col", daycontainer);
            eventCol.textContent = this.options.emptyDayVocab;

            cDay = new Date(t + daystamp);
        }

        let firstDayAppend = this.getDateAppendee(firstDay.getDate())
        let lastDayAppend = this.getDateAppendee(lastDay.getDate());

        if (firstDay.getMonth() == lastDay.getMonth()) {
            this.titlecontroller.textContent = this.options.monthsVocab[firstDay.getMonth()] + " " +
                firstDay.getDate() + firstDayAppend + " - " + lastDay.getDate() + lastDayAppend + ", " + this.state.year;

        } else if (firstDay.getYear() == lastDay.getYear()) {
            this.titlecontroller.textContent =
                this.options.monthsVocab[firstDay.getMonth()] + " " + firstDay.getDate() + firstDayAppend + " - " +
                this.options.monthsVocab[lastDay.getMonth()] + " " + lastDay.getDate() + lastDayAppend + ", " +
                this.state.year;

        } else {
            this.titlecontroller.textContent =
                this.options.monthsVocab[firstDay.getMonth()] + " " + firstDay.getDate() + firstDayAppend + ", " +
                firstDay.getFullYear() + " - " +
                this.options.monthsVocab[lastDay.getMonth()] + " " + lastDay.getDate() + lastDayAppend + ", " +
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

        for (let row = 0; row < 6; row++) {
            let tr = _a('tr', "jscal-row row" + row, this.table);

            for (let col = 0; col < 7; col++) {
                let date = new Date(this.state.year, this.state.month, ++startAt);

                let td = _a('td', 'jscal-col row' + row + "col" + col, tr);
                let inMonth = true;
                let daySpan = _a('span', 'cell-number', td);
                if (startAt <= 0 || startAt > totalDays) {
                    let inMonth = false;
                    td.classList.add("notinmonth");
                    daySpan.textContent = date.getDate();
                } else {
                    daySpan.classList.add("not-in-month");
                    daySpan.textContent = date.getDate();
                }

                isCurrentMonth && currentDay == startAt && td.classList.add("cell-today");
                tr.appendChild(td);

                this.validateCell(date.getFullYear(), date.getMonth(), date.getDate());
                let events = this.state.matrix[date.getFullYear()][date.getMonth()][date.getDate()];
                if (events) {
                    for (let k = 0; k < events.length; k++) {
                        events[k].render(this.state.view, td);
                    }
                }

                let fulldate = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
                td.dataset.at = date.getTime();
                td.dataset.fulldate = fulldate;
                td.addEventListener('mouseenter', () => {
                    if (this.state.dragging) {
                        td.appendChild(this.state.dragged.monthElem);
                        this.state.newPosition = td.dataset.fulldate;
                        this.state.newAt = td.dataset.at;
                    }
                });

                daySpan.addEventListener('click', () => {
                    this.goToDay(fulldate);
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
        if (this.options.width == "full") {
            this.elem.style.width = "auto";
            this.state.responsiveWidth = this.elem.getBoundingClientRect().width;
        } else {
            this.elem.style.width = this.options.width + "px";
        }

        let cols = this.elem.querySelectorAll(".jscal-col");
        for (let i = 0; i < cols.length; i++) {
            cols[i].style.height = (this.options.height / 6) + "px";
            cols[i].style.width = ((this.state.responsiveWidth || this.options.width) / 7) + "px";
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

    validateCell(year = this.state.year, month = this.state.month, day = this.state.day) {
        if (!this.state.matrix[year]) {
            this.state.matrix[year] = {
                0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {},
                6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
            }
        }

        if (!this.state.matrix[year][month]) {
            this.state.matrix[year][month] = {};
        }

        if (!this.state.matrix[year][month][day]) {
            this.state.matrix[year][month][day] = [];
        }
    }

    moveCell(ev) {
        let oldPos = ev.position;
        let newPos = this.state.newPosition;

        if (!ev) {
            return this.fire("cellDidNotMove", { event: ev, reason: new Error("moveCell was fired without an event") })
        }

        this.fire('cellMightMove', ev);
        if (this.state.view == "day") {
            if (!ev.potentialnewtop || ev.potentialnewtop == ev.daytop) {
                return this.fire("click", ev);
            }

            let newtop = ev.potentialnewtop;
            newtop = newtop - (newtop % this.options.dayviewGapHeight);

            let newgap = newtop / this.options.dayviewGapHeight;

            if (newgap != ev.gapcell) {
                ev.gapcell = newgap;
                ev.dayElem.style.top = newtop + "px";
                ev.daytop = newtop;

                let totalMinutes = newgap * this.options.dayviewGapMinutes;
                let oldat = ev.at;
                ev.at = new Date(this.state.year, this.state.month, this.state.day, 0, totalMinutes);
                ev.updateElements();

                this.fire('cellMoved', { event: ev, oldtime: oldat, newtime: ev.at });
                this.state.skipscroll = true;
                this.render();
            } else {
                ev.dayElem.style.top = newtop + "px";
                this.fire('cellDidNotMove', { event: ev, reason: new Error("Distance between click and drop not big enough") });
            }

        } else if (newPos && newPos != oldPos) {
            this.fire('cellWillMove', { event: ev, oldPosition: oldPos, newPosition: newPos });
            let oldPosObj = oldPos.split('-');
            let newPosObj = newPos.split('-');

            let dayCell = this.state.matrix[oldPosObj[0]][oldPosObj[1]][oldPosObj[2]];
            let index = dayCell ? dayCell.indexOf(ev) : -1;

            let newAt = new Date(ev.at);
            newAt.setDate(newPosObj[2]);
            newAt.setMonth(newPosObj[1]);
            newAt.setFullYear(newPosObj[0]);

            ev.at = newAt;

            if (index != -1) {
                dayCell.splice(index, 1);
                this.validateCell(newPosObj[0], newPosObj[1], newPosObj[2]);

                let arr = this.state.matrix[newPosObj[0]][newPosObj[1]][newPosObj[2]];
                arr = arr || [];
                this.state.matrix[newPosObj[0]][newPosObj[1]][newPosObj[2]] = arr;
                arr.push(ev);

                ev.position = newPos;
                this.fire('cellMoved', { event: ev, oldPosition: oldPos, newPosition: newPos, newtime: ev.at });
            } else {
                this.fire('cellDidNotMove', { event: ev, reason: new Error("Could not find cell in matrix") });
            }
        } else {
            this.fire('cellDidNotMove', { event: ev, reason: new Error("Position did not change") });
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

    appendMatrix(matrix, rerender) {
        this.fire("matrixWillAppend");
        let newMatrix = this.state.matrix;

        for (let year in matrix) {
            if (!newMatrix[year]) {
                newMatrix[year] = {
                    0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {},
                    6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
                };
            }

            let monthsToMerge = matrix[year];
            for (let month in monthsToMerge) {
                let days = matrix[year][month];
                for (let day in days) {
                    if (!newMatrix[year][month][day]) {
                        newMatrix[year][month][day] = [];
                    }

                    newMatrix[year][month][day].push(...matrix[year][month][day].map(e => {
                        return new JSCalendarEvent(e, this, year + "-" + month + "-" + day);
                    }));
                }
            }
        }

        this.fire("matrixAppended");
        rerender && this.render();
        return this;
    }

    setMatrix(matrix, rerender) {
        _jscallog("Setting new matrix to instance " + this.id);
        this.fire('matrixWillSet');
        if (!matrix) {
            matrix = JSCalendar.defaultMatrix();
        }

        this.state.matrix = matrix;

        for (let year in this.state.matrix) {
            for (let month in this.state.matrix[year]) {
                for (let day in this.state.matrix[year][month]) {
                    for (let i = 0; i < this.state.matrix[year][month][day].length; i++) {
                        this.state.matrix[year][month][day][i] = new JSCalendarEvent(
                            this.state.matrix[year][month][day][i],
                            this,
                            year + "-" + month + "-" + day
                        );
                    }
                }
            }
        }

        _jscallog("No problem setting new matrix to instance " + this.id);
        this.fire('matrixSet');
        this.state.matrixmonth = this.state.month;
        rerender && this.render();
        return this;
    }

    debug() {
        let matrix = {};

        for (let day in this.state.matrix[this.state.year][this.state.month]) {
            let events = this.state.matrix[this.state.year][this.state.month][day];
            matrix[day] = events.map(e => {
                return {
                    displayname: e.displayname,
                    at: new Date(e.at),
                    duration: e.duration
                }
            });
        }

        return {
            year: this.state.year,
            month: this.state.month,
            day: this.state.day,
            weekday: this.state.weekday,
            view: this.state.view,
            monthMatrix: matrix
        };
    }

    fetch(done, force) {
        if (!force && this.state.matrix[this.state.year] && this.state.matrix[this.state.year][this.state.month]) {
            _jscallog("Loading matrix from local cache");
            done && done();
        } else if (this.options.datasource) {
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

            let evObject = { url };
            this.fire('willFetch', evObject);
            request.onreadystatechange = () => {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    try {
                        let maybeMatrix = JSON.parse(request.responseText);
                        this.fire('fetched', maybeMatrix);

                        if (this.options.fetchReplaces ? this.setMatrix(maybeMatrix) : this.appendMatrix(maybeMatrix)) {
                            _jscallog("Updated matrix from data source")
                            done && done(undefined, maybeMatrix);
                        } else {
                            _jscallog("Received invalid matrix");
                            done && done(new Error("Invalid matrix size"), maybeMatrix);
                        }
                    } catch (err) {
                        _jscallog("Caught error during matrix parsing : " + err);
                        done && done(err);
                    }
                } else if (request.status && request.status != 200) {
                    _jscallog("Received non-200 HTTP response code : " + request.status);
                    done && done(new Error("Non-200 HTTP response code : " + request.status), request.status);
                }
            };

            _jscallog("Sending async request to data source : " + this.options.datasource);
            request.open('GET', evObject.url);
            request.send();
        } else {
            _jscallog("Created new entry in matrix for " + this.state.year + "/" + this.state.month);
            if (!this.state.matrix[this.state.year]) {
                this.state.matrix[this.state.year] = {
                    0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {},
                    6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
                };
            }

            if (!this.state.matrix[this.state.year][this.state.month]) {
                this.state.matrix[this.state.year][this.state.month] = {};
            }

            done && done(new Error("Invalid datasource"));
        }

        return this;
    }

    // https://stackoverflow.com/questions/4881938/javascript-calculate-number-of-days-in-month-for-a-given-year
    // Credit to : Matti Virkkunen
    static getDaysInMonth(year, month) {
        let isLeap = ((year % 4) == 0 && ((year % 100) != 0 || (year % 400) == 0));
        return {
            numberOfDays: [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month],
            firstDay: new Date(year, month).getDay()
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
        let year = new Date().getFullYear();
        return {
            [year - 1]: {
                0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {},
                6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
            },
            [year]: {
                0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
            },
            [year + 1]: {
                0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
            }
        };
    }

    static createState() {
        let now = new Date();
        return {
            view: "month",

            matrix: JSCalendar.defaultMatrix(),
            matrixmonth: now.getMonth(),

            year: now.getFullYear(),
            month: now.getMonth(),   // has array padding, 0 is January
            day: now.getDate(),
            weekday: now.getDay(),     // has array padding, 0 is Sunday

            dragging: false
        };
    }

    static getInstance(id) {
        return _jsCalWrapper.instances[id];
    }

    static get defaultOptions() {
        return {
            views: ["day", "week", "month"],
            viewsVocab: {
                day: "Day",
                week: "Week",
                month: "Month"
            },
            buttons: ["previous", "today", "next"],
            buttonsActions: {
                previous: "goBack",
                today: "goNow",
                next: "goNext"
            },
            buttonsVocab: {
                previous: "<",
                today: "Today",
                next: ">"
            },
            monthsVocab: [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ],
            daysVocab: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            nthVocab: {
                1: "st",
                2: "nd",
                3: "rd",
                default: "th"
            },
            emptyDayVocab: "Nothing here.",
            noDate: "Somewhen",
            nonameEventVocab: "Event without a name",
            globalSelector: ".js-calendar",
            eventBackground: "rgb(126, 156, 193)",
            titleCropSize: 20,
            dayviewGapMinutes: 30,
            dayviewNoTimeGapSize: 2,
            dayviewGapHeight: 38,
            datasource: "",
            datasourceHeaders: {},
            ampm: true,
            displaySeconds: false,
            alwaysFetch: false,
            fetchReplaces: false,
            height: 700,
            width: 1024
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

(() => {
    module.exports = {JSCalendar, JSCalendarEvent}
})(JSCalendar, JSCalendarEvent)