"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _jscallog = function _jscallog(msg) {
    console.log("[JSCalendar - " + new Date().toLocaleTimeString() + "] " + msg);
};

var _jsCalWrapper = {
    instances: {}
};

var _a = function _a(tag, classes, parentElem) {
    var elem = document.createElement(tag);
    elem.className = classes || "";
    parentElem && parentElem.appendChild(elem);
    return elem;
};

var JSCalendarEvent = function () {
    function JSCalendarEvent(data, calendar, position) {
        _classCallCheck(this, JSCalendarEvent);

        if (!data) {
            return false;
        }

        this.setData(data);
        this.setID(data.id);
        this.position = position;
        this.options = calendar.options;
        this.calendar = calendar;
        this.buildElements();
        this.updateElements();
        this.bindEvents();
    }

    _createClass(JSCalendarEvent, [{
        key: "setID",
        value: function setID(id) {
            this.id = id;
        }
    }, {
        key: "getID",
        value: function getID() {
            return this.id;
        }
    }, {
        key: "setData",
        value: function setData(data) {
            this.at = data.at && new Date(data.at);
            this.duration = data.duration;
            this.displayname = data.displayname;
            this.color = data.color;
            this.html = data.html;
        }
    }, {
        key: "formatDuration",
        value: function formatDuration(d) {
            var append = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
            var prepend = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";

            if (!d) {
                return "";
            }

            d = Math.floor(d / 1000 / 60);

            var h = Math.floor(d / 60);
            var m = d % 60;

            return append + (h ? h + "h " : "") + (m ? m + "mins" : "") + prepend;
        }
    }, {
        key: "formatTime",
        value: function formatTime(t) {
            var h = t.getHours();
            var m = t.getMinutes();
            var s = t.getSeconds();

            var append = "";
            if (this.options.ampm) {
                if (h > 11) {
                    h -= h == 12 ? 0 : 12;
                    append = " PM";
                } else {
                    append = " AM";
                }
            }

            return h + (m < 10 ? ":0" : ":") + m + (this.displaySeconds ? (s < 10 ? ":0" : ":") + s : "") + append;
        }
    }, {
        key: "buildElements",
        value: function buildElements() {
            this.monthElem = _a('div', 'cell-event-mark');
            this.weekElem = _a("div", "cal-week-day-event-col");
            this.dayElem = _a("div", "cal-total-day-event-view");
        }
    }, {
        key: "updateElements",
        value: function updateElements() {
            var monthElem = this.monthElem;
            var weekElem = this.weekElem;
            var dayElem = this.dayElem;

            // Month element
            if (this.at) {
                var dateText = this.formatTime(new Date(this.at));
                monthElem.textContent = dateText;
                monthElem.dataset.at = this.at;
            }

            if (this.displayname) {
                var shortname = this.displayname.substring(0, this.options.titleCropSize);
                monthElem.textContent += (this.at ? " - " : "") + shortname + (shortname.length != this.displayname ? "..." : "");
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
                var outputString = void 0;
                outputString = this.formatTime(this.at);
                if (this.duration) {
                    var end = new Date(this.at.getTime() + this.duration);
                    outputString += " - " + this.formatTime(end);
                }

                var timefloat = weekElem.querySelector(".cal-week-day-time-float") || _a('span', 'cal-week-day-time-float', weekElem);
                timefloat.textContent = outputString;
            }

            // Day element
            var gapMinuteSize = this.options.dayviewGapMinutes;
            var gapsPerHour = 60 / gapMinuteSize;

            this.gapcell = -1;
            if (this.at) {
                this.gapcell = this.at.getHours() * gapsPerHour + this.at.getMinutes() / gapMinuteSize;
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

            var dayText = dayElem.querySelector(".cal-total-day-displayname") || _a('div', 'cal-total-day-displayname', dayElem);
            dayText.textContent = this.displayname || this.options.nonameEventVocab;

            if (this.at) {
                var timeText = dayElem.querySelector(".cal-total-day-time") || _a('div', 'cal-total-day-time', dayElem);
                timeText.textContent = this.formatTime(new Date(this.at)) + this.formatDuration(this.duration, ', ');
            }
        }
    }, {
        key: "getDayGap",
        value: function getDayGap() {
            return this.gapcell;
        }
    }, {
        key: "dragging",
        value: function dragging() {
            this.monthElem.classList.add('dragged');
            this.weekElem.classList.add('dragged');
            this.dayElem.classList.add('dragged');
            this.calendar.dragging(this);
        }
    }, {
        key: "dropped",
        value: function dropped() {
            this.monthElem.classList.remove('dragged');
            this.weekElem.classList.remove('dragged');
            this.dayElem.classList.remove('dragged');
            this.calendar.dropped(this);
        }
    }, {
        key: "bindEvents",
        value: function bindEvents() {
            var _this = this;

            this.monthElem.addEventListener('mousedown', function () {
                var finish = function finish() {
                    window.removeEventListener('mouseup', finish);
                    _this.dropped();
                };
                window.addEventListener('mouseup', finish);

                _this.dragging();
            });

            this.weekElem.addEventListener('mousedown', function () {
                var finish = function finish() {
                    window.removeEventListener('mouseup', finish);
                    _this.dropped();
                };
                window.addEventListener('mouseup', finish);

                _this.dragging();
            });

            this.dayElem.addEventListener('mousedown', function (ev) {
                var finish = function finish() {
                    window.removeEventListener('mouseup', finish);
                    _this.dropped();
                };
                window.addEventListener('mouseup', finish);

                _this.originalY = ev.y;
                _this.potentialnewtop = _this.daytop;
                _this.dragging();
            });

            this.monthElem.addEventListener('click', function () {
                _this.calendar.fire("click", _this);
            });

            this.weekElem.addEventListener('click', function () {
                _this.calendar.fire("click", _this);
            });
        }
    }, {
        key: "render",
        value: function render(view, container) {
            container.appendChild(this[view + "Elem"]);
        }
    }, {
        key: "destroy",
        value: function destroy() {
            this.monthElem && this.monthElem.remove();
            this.weekElem && this.weekElem.remove();
            this.dayElem && this.dayElem.remove();

            this.monthElem = undefined;
            this.weekElem = undefined;
            this.dayElem = undefined;
        }
    }]);

    return JSCalendarEvent;
}();

var JSCalendar = function () {
    function JSCalendar(elem, options) {
        _classCallCheck(this, JSCalendar);

        this.elem = elem;
        this.id = elem.id;
        this.options = Object.assign(JSCalendar.defaultOptions, options || { defaultOptions: true });
        this.state = JSCalendar.createState();
        this.hooks = {};

        if (Math.floor(60 / this.options.dayviewGapMinutes) != 60 / this.options.dayviewGapMinutes) {
            throw new Error("Option dayviewGapMinutes must be a divisor of 60");
        }

        this.fire("new");
    }

    _createClass(JSCalendar, [{
        key: "init",
        value: function init(done) {
            _jscallog("Created new instance with id : " + this.id);
            this.fire('init');
            this.createStructure();

            return this.options.datasource ? this.fetch(done) : this.render();
        }
    }, {
        key: "createStructure",
        value: function createStructure() {
            var _this2 = this;

            JSCalendar.emptyElem(this.elem);
            this.elem.classList.add("js-calendar");

            this.controlbar = _a('div', "control-bar", this.elem);
            this.tablewrapper = _a('div', "calendar-wrapper", this.elem);
            this.table = _a('table', "calendar-table", this.tablewrapper);

            this.viewcontroller = _a('div', 'control-bar-widget control-bar-views', this.controlbar);
            this.actioncontroller = _a('div', 'control-bar-widget control-bar-actions', this.controlbar);
            this.titlecontroller = _a('div', 'control-bar-widget control-bar-title', this.controlbar);

            this.options.views.forEach(function (v) {
                var word = _this2.options.viewsVocab[v] || v;
                var button = _a('button', 'control-button change-view change-view-' + v, _this2.viewcontroller);
                button.addEventListener('click', function () {
                    _this2.setView(v);
                });
                button.textContent = word;
            });

            this.options.buttons.forEach(function (b) {
                var word = _this2.options.buttonsVocab[b] || b;
                var button = _a('button', 'control-button calendar-action calendar-action-' + b, _this2.actioncontroller);
                var action = _this2.options.buttonsActions[b];
                button.addEventListener('click', function () {
                    if (typeof action == "function") {
                        action(_this2);
                    } else {
                        _this2[action]();
                    }
                });
                button.textContent = word;
            });
        }
    }, {
        key: "goNow",
        value: function goNow() {
            var now = new Date();
            this.state.year = now.getFullYear();
            this.state.month = now.getMonth();
            this.state.day = now.getDate();
            this.state.weekday = now.getDay();
            this.adjustDateToView();

            return this.render();
        }
    }, {
        key: "goBack",
        value: function goBack() {
            if (this.state.view == "day") {
                this.state.day--;

                if (this.state.day == 0) {
                    this.state.month--;
                    if (this.state.month == 0) {
                        this.state.month = 11;
                        this.state.year--;
                    }

                    var monthStat = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
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
                this.state.day = this.state.day - this.state.day % 7;

                if (this.state.day <= 0) {
                    this.state.month--;
                    if (this.state.month == -1) {
                        this.state.month = 11;
                        this.state.year--;
                    }

                    var _monthStat = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
                    this.state.day = _monthStat.numberOfDays + this.state.day;
                }
            }

            return this.render();
        }
    }, {
        key: "goNext",
        value: function goNext() {
            if (this.state.view == "day") {
                var monthStat = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
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
                var _monthStat2 = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
                this.state.day += 7;
                if (this.state.day > _monthStat2.numberOfDays) {
                    this.state.month++;
                    if (this.state.month == 12) {
                        this.state.month = 0;
                        this.state.year++;
                    }

                    this.state.day = this.state.day - _monthStat2.numberOfDays;
                }
            }

            return this.render();
        }
    }, {
        key: "goToDay",
        value: function goToDay(position) {
            var date = position.split('-');
            date = new Date(date[0], date[1], date[2]);

            this.state.year = date.getFullYear();
            this.state.month = date.getMonth();
            this.state.day = date.getDate();
            this.setView("day");
        }
    }, {
        key: "push",
        value: function push(item) {
            this.fire('willPush', item);

            if (item.at) {
                var date = new Date(item.at);
                this.validateCell(date.getFullYear(), date.getMonth(), date.getDate());
                this.state.matrix[date.getFullYear()][date.getMonth()][date.getDate()].push(new JSCalendarEvent(item.event, this, date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate()));

                this.fire('pushed', item);
            } else {
                this.fire("didNotPush", item);
            }

            return this;
        }
    }, {
        key: "on",
        value: function on(event, callback) {
            this.hooks[event] = this.hooks[event] || [];
            this.hooks[event].push(callback);

            return this;
        }
    }, {
        key: "fire",
        value: function fire(event, extra) {
            var _this3 = this;

            _jscallog("Firing event '" + event + "'");
            JSCalendar.fire(event, this, extra);

            var events = this.hooks[event] || [];
            events.forEach(function (e) {
                e(_this3, extra);
            });

            return this;
        }
    }, {
        key: "destroy",
        value: function destroy() {
            for (var year in this.state.matrix) {
                for (var month in this.state.matrix[year]) {
                    for (var day in this.state.matrix[year][month]) {
                        for (var i = 0; i < this.state.matrix[year][month][day].length; i++) {
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
    }, {
        key: "adjustDateToView",
        value: function adjustDateToView() {
            if (this.state.view == "week" && this.state.weekday != this.state.day && this.state.day < 8) {
                this.state.month--;
                this.state.day = JSCalendar.getDaysInMonth(this.state.year, this.state.month).numberOfDays;
            }
        }
    }, {
        key: "getDateAppendee",
        value: function getDateAppendee() {
            var d = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.state.day;

            if (d > 3 && d < 21) {
                return this.options.nthVocab.default;
            }

            return this.options.nthVocab[d.toString().slice(-1)] || this.options.nthVocab.default;
        }
    }, {
        key: "setView",
        value: function setView(view) {
            this.fire('viewWillChange');
            if (this.state.view != view) {
                this.state.view = view;
                this.adjustDateToView();
                this.render();
                this.fire('viewChanged');
            }

            return this;
        }
    }, {
        key: "render",
        value: function render() {
            var _this4 = this;

            this.fire("willRender");
            _jscallog("Rendering instance " + this.id);
            var benchStart = Date.now();

            this.fetch(function () {
                JSCalendar.emptyElem(_this4.table);
                switch (_this4.state.view) {
                    case "day":
                        _this4.renderDay();
                        break;

                    case "week":
                        _this4.renderWeek();
                        break;

                    case "month":
                    default:
                        _this4.renderMonth();
                }

                _this4.applyCSS();
                _this4.updateControls();
                _this4.fire("rendered");

                _jscallog("Rendering benchmark : " + (Date.now() - benchStart) + "ms");
            }, this.options.alwaysFetch);

            return this;
        }
    }, {
        key: "renderDay",
        value: function renderDay() {
            var _this5 = this;

            this.titlecontroller.textContent = this.options.monthsVocab[this.state.month] + " " + this.state.day + this.getDateAppendee() + ", " + this.state.year;

            var dayrow = _a("tr", "cal-week-day-row", this.table);
            var daycol = _a("td", "cal-week-day-col", dayrow);

            this.validateCell();
            var events = this.state.matrix[this.state.year][this.state.month][this.state.day];
            var noTimeWrap = _a('div', 'single-day-no-time-wrap', daycol);
            var timetable = _a('div', 'single-day-time-table', daycol);
            var eventwrap = _a('div', 'cal-total-day-event-wrap', timetable);

            events.filter(function (e) {
                return !e.at;
            }).forEach(function (e) {
                e.render(_this5.state.view, noTimeWrap);
            });

            eventwrap.addEventListener('mousemove', function (ev) {
                if (_this5.state.dragging) {
                    var top = _this5.state.dragged.daytop - (_this5.state.dragged.originalY - ev.y);
                    _this5.state.dragged.dayElem.style.top = top + "px";
                    _this5.state.dragged.potentialnewtop = top;
                }
            });

            // Loop through hours
            var minGap = this.options.dayviewGapMinutes;
            var gapsPerHour = Math.ceil(60 / minGap);
            var gapindex = 0;
            for (var h = 0; h < 24; h++) {
                for (var gapi = 0; gapi < gapsPerHour; gapi++) {
                    var minutesBlock = _a('div', 'hour-block gap-' + ++gapindex, timetable);
                    var timespan = _a('span', 'minutes-block-time', minutesBlock);

                    minutesBlock.classList.add(gapi == 0 ? "hour-gap" : "minutes-gap");

                    var mins = gapi * minGap;
                    var dh = h;
                    var appendee = "";
                    minutesBlock.style.height = this.options.dayviewGapHeight - 1 + "px";
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

            var groups = {};
            var smallestGap = -1;
            events.filter(function (e) {
                return e.at;
            }).forEach(function (e) {
                e.render(_this5.state.view, eventwrap);
                e.ratio = 100;
                e.dayElem.style.left = "0";
                e.dayElem.style.right = "0";

                var totalgaps = e.gapcount;
                if (Math.floor(e.gapcell) != e.gapcell) {
                    totalgaps++;
                }

                for (var i = 0; i < totalgaps; i++) {
                    var g = Math.floor(e.gapcell + i);
                    if (!groups[g]) {
                        groups[g] = [];
                    }

                    groups[g].push(e);
                }

                if (smallestGap == -1 || smallestGap > e.gapcell) {
                    smallestGap = e.gapcell;
                }
            });

            var _loop = function _loop(gap) {
                var total = groups[gap].length;
                var ratio = 100 / total;
                var index = 0;

                groups[gap].forEach(function (e) {
                    var minleft = index * ratio;
                    var minright = ratio * (total - index - 1);

                    if (ratio < e.ratio) {
                        e.ratio = ratio;
                        e.dayElem.style.left = minleft + "%";
                        e.dayElem.style.right = minright + "%";
                    }

                    index++;
                });
            };

            for (var gap in groups) {
                _loop(gap);
            }

            if (this.state.skipscroll) {
                this.state.skipscroll = false;
            } else {
                this.tablewrapper.scrollTop = smallestGap * this.options.dayviewGapHeight;
            }
        }
    }, {
        key: "renderWeek",
        value: function renderWeek() {
            var _this6 = this;

            var daystamp = 1000 * 60 * 60 * 24;

            var dayrow = _a("tr", "cal-week-day-row", this.table);
            var daycol = _a("td", "cal-week-day-col", dayrow);

            var month = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
            var dayObj = new Date(this.state.year, this.state.month, this.state.day);
            var firstDay = new Date(dayObj.getTime() - dayObj.getDay() * daystamp);
            var lastDay = new Date(firstDay.getTime() + 6 * daystamp);

            this.validateCell(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate());
            this.validateCell(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());

            _jscallog("Rending matrix week");
            var cDay = new Date(firstDay.getTime());

            var _loop2 = function _loop2(i) {
                var y = cDay.getFullYear();
                var m = cDay.getMonth();
                var d = cDay.getDate();
                var w = cDay.getDay();
                var t = cDay.getTime();

                var daysep = _a('div', "cal-week-day-sep", daycol);
                daysep.textContent = _this6.options.daysVocab[w] + ", " + _this6.options.monthsVocab[m] + " " + d;

                var daycontainer = _a('div', "col-week-day-container", daycol);
                if (_this6.state.matrix[y][m][d]) {
                    var events = _this6.state.matrix[y][m][d];
                    for (var j = 0; j < events.length; j++) {
                        var event = events[j];
                        event.render(_this6.state.view, daycontainer);
                    }
                }

                var fulldate = y + "-" + m + "-" + d;
                daycontainer.dataset.fulldate = fulldate;
                daycontainer.dataset.at = cDay.getTime();
                daycontainer.addEventListener('mouseenter', function () {
                    if (_this6.state.dragging) {
                        daycontainer.appendChild(_this6.state.dragged.weekElem);
                        _this6.state.newPosition = fulldate;
                        _this6.state.newAt = cDay.getTime();
                    }
                });

                daysep.addEventListener('click', function () {
                    _this6.goToDay(fulldate);
                });

                var eventCol = _a("div", "cal-week-day-no-event-col", daycontainer);
                eventCol.textContent = _this6.options.emptyDayVocab;

                cDay = new Date(t + daystamp);
            };

            for (var i = 0; i < 7; i++) {
                _loop2(i);
            }

            var firstDayAppend = this.getDateAppendee(firstDay.getDate());
            var lastDayAppend = this.getDateAppendee(lastDay.getDate());

            if (firstDay.getMonth() == lastDay.getMonth()) {
                this.titlecontroller.textContent = this.options.monthsVocab[firstDay.getMonth()] + " " + firstDay.getDate() + firstDayAppend + " - " + lastDay.getDate() + lastDayAppend + ", " + this.state.year;
            } else if (firstDay.getYear() == lastDay.getYear()) {
                this.titlecontroller.textContent = this.options.monthsVocab[firstDay.getMonth()] + " " + firstDay.getDate() + firstDayAppend + " - " + this.options.monthsVocab[lastDay.getMonth()] + " " + lastDay.getDate() + lastDayAppend + ", " + this.state.year;
            } else {
                this.titlecontroller.textContent = this.options.monthsVocab[firstDay.getMonth()] + " " + firstDay.getDate() + firstDayAppend + ", " + firstDay.getFullYear() + " - " + this.options.monthsVocab[lastDay.getMonth()] + " " + lastDay.getDate() + lastDayAppend + ", " + lastDay.getFullYear();
            }
        }
    }, {
        key: "renderMonth",
        value: function renderMonth() {
            var _this7 = this;

            var month = JSCalendar.getDaysInMonth(this.state.year, this.state.month);
            var startAt = -month.firstDay;
            var totalDays = month.numberOfDays;

            var now = new Date();
            var isCurrentMonth = now.getMonth() == this.state.month && now.getFullYear() == this.state.year;
            var currentDay = now.getDate();

            var titleRow = _a('tr', "jscal-weekday-row", this.table);
            for (var day = 0; day < this.options.daysVocab.length; day++) {
                var td = _a('td', "js-cal-weekday", titleRow);
                td.textContent = this.options.daysVocab[day];
            }

            for (var row = 0; row < 6; row++) {
                var tr = _a('tr', "jscal-row row" + row, this.table);

                var _loop3 = function _loop3(col) {
                    var date = new Date(_this7.state.year, _this7.state.month, ++startAt);

                    var td = _a('td', 'jscal-col row' + row + "col" + col, tr);
                    var inMonth = true;
                    var daySpan = _a('span', 'cell-number', td);
                    if (startAt <= 0 || startAt > totalDays) {
                        var _inMonth = false;
                        td.classList.add("notinmonth");
                        daySpan.textContent = date.getDate();
                    } else {
                        daySpan.classList.add("not-in-month");
                        daySpan.textContent = date.getDate();
                    }

                    isCurrentMonth && currentDay == startAt && td.classList.add("cell-today");
                    tr.appendChild(td);

                    _this7.validateCell(date.getFullYear(), date.getMonth(), date.getDate());
                    var events = _this7.state.matrix[date.getFullYear()][date.getMonth()][date.getDate()];
                    if (events) {
                        for (var k = 0; k < events.length; k++) {
                            events[k].render(_this7.state.view, td);
                        }
                    }

                    var fulldate = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
                    td.dataset.at = date.getTime();
                    td.dataset.fulldate = fulldate;
                    td.addEventListener('mouseenter', function () {
                        if (_this7.state.dragging) {
                            td.appendChild(_this7.state.dragged.monthElem);
                            _this7.state.newPosition = td.dataset.fulldate;
                            _this7.state.newAt = td.dataset.at;
                        }
                    });

                    daySpan.addEventListener('click', function () {
                        _this7.goToDay(fulldate);
                    });
                };

                for (var col = 0; col < 7; col++) {
                    _loop3(col);
                }
            }

            this.titlecontroller.textContent = this.options.monthsVocab[this.state.month] + " " + this.state.year;
        }
    }, {
        key: "updateControls",
        value: function updateControls() {
            var oldState = this.controlbar.querySelector(".active");
            oldState && oldState.classList.remove("active");

            var button = this.controlbar.querySelector(".change-view-" + this.state.view);
            button && button.classList.add('active');
        }
    }, {
        key: "applyCSS",
        value: function applyCSS() {
            if (this.options.width == "full") {
                this.elem.style.width = "auto";
                this.state.responsiveWidth = this.elem.getBoundingClientRect().width;
            } else {
                this.elem.style.width = this.options.width + "px";
            }

            var cols = this.elem.querySelectorAll(".jscal-col");
            for (var i = 0; i < cols.length; i++) {
                cols[i].style.height = this.options.height / 6 + "px";
                cols[i].style.width = (this.state.responsiveWidth || this.options.width) / 7 + "px";
            }

            this.elem.querySelector('.calendar-wrapper').style.maxHeight = this.options.height + 40 + "px";
        }
    }, {
        key: "setDate",
        value: function setDate(year, month, day, rerender) {
            this.state.year = year;
            this.state.month = month;
            this.state.day = day;
            this.state.weekday = new Date(year, month, day).getDay();

            rerender && this.render();
        }
    }, {
        key: "validateCell",
        value: function validateCell() {
            var year = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.state.year;
            var month = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.state.month;
            var day = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.state.day;

            if (!this.state.matrix[year]) {
                this.state.matrix[year] = {
                    0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {},
                    6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
                };
            }

            if (!this.state.matrix[year][month]) {
                this.state.matrix[year][month] = {};
            }

            if (!this.state.matrix[year][month][day]) {
                this.state.matrix[year][month][day] = [];
            }
        }
    }, {
        key: "moveCell",
        value: function moveCell(ev) {
            var oldPos = ev.position;
            var newPos = this.state.newPosition;

            if (!ev) {
                return this.fire("cellDidNotMove", { event: ev, reason: new Error("moveCell was fired without an event") });
            }

            this.fire('cellMightMove', ev);
            if (this.state.view == "day") {
                if (!ev.potentialnewtop || ev.potentialnewtop == ev.daytop) {
                    return this.fire("click", ev);
                }

                var newtop = ev.potentialnewtop;
                newtop = newtop - newtop % this.options.dayviewGapHeight;

                var newgap = newtop / this.options.dayviewGapHeight;

                if (newgap != ev.gapcell) {
                    ev.gapcell = newgap;
                    ev.dayElem.style.top = newtop + "px";
                    ev.daytop = newtop;

                    var totalMinutes = newgap * this.options.dayviewGapMinutes;
                    var oldat = ev.at;
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
                var oldPosObj = oldPos.split('-');
                var newPosObj = newPos.split('-');

                var dayCell = this.state.matrix[oldPosObj[0]][oldPosObj[1]][oldPosObj[2]];
                var _index = dayCell ? dayCell.indexOf(ev) : -1;

                var newAt = new Date(ev.at);
                newAt.setDate(newPosObj[2]);
                newAt.setMonth(newPosObj[1]);
                newAt.setFullYear(newPosObj[0]);

                ev.at = newAt;

                if (_index != -1) {
                    dayCell.splice(_index, 1);
                    this.validateCell(newPosObj[0], newPosObj[1], newPosObj[2]);

                    var arr = this.state.matrix[newPosObj[0]][newPosObj[1]][newPosObj[2]];
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
    }, {
        key: "dragging",
        value: function dragging(ev) {
            this.fire('dragging', ev);
            this.state.dragging = true;
            this.state.dragged = ev;
            this.state.newPosition = undefined;
            this.elem.classList.add("dragging");
        }
    }, {
        key: "dropped",
        value: function dropped(ev) {
            this.fire('dropped', ev);
            this.moveCell(ev);

            this.state.dragging = false;
            this.state.dragged = undefined;
            this.elem.classList.remove("dragging");
        }
    }, {
        key: "appendMatrix",
        value: function appendMatrix(matrix, rerender) {
            var _this8 = this;

            this.fire("matrixWillAppend");
            var newMatrix = this.state.matrix;

            var _loop4 = function _loop4(year) {
                if (!newMatrix[year]) {
                    newMatrix[year] = {
                        0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {},
                        6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
                    };
                }

                var monthsToMerge = matrix[year];

                var _loop5 = function _loop5(month) {
                    var days = matrix[year][month];

                    var _loop6 = function _loop6(day) {
                        var _newMatrix$year$month;

                        if (!newMatrix[year][month][day]) {
                            newMatrix[year][month][day] = [];
                        }

                        (_newMatrix$year$month = newMatrix[year][month][day]).push.apply(_newMatrix$year$month, _toConsumableArray(matrix[year][month][day].map(function (e) {
                            return new JSCalendarEvent(e, _this8, year + "-" + month + "-" + day);
                        })));
                    };

                    for (var day in days) {
                        _loop6(day);
                    }
                };

                for (var month in monthsToMerge) {
                    _loop5(month);
                }
            };

            for (var year in matrix) {
                _loop4(year);
            }

            this.fire("matrixAppended");
            rerender && this.render();
            return this;
        }
    }, {
        key: "setMatrix",
        value: function setMatrix(matrix, rerender) {
            _jscallog("Setting new matrix to instance " + this.id);
            this.fire('matrixWillSet');
            if (!matrix) {
                matrix = JSCalendar.defaultMatrix();
            }

            this.state.matrix = matrix;

            for (var year in this.state.matrix) {
                for (var month in this.state.matrix[year]) {
                    for (var day in this.state.matrix[year][month]) {
                        for (var i = 0; i < this.state.matrix[year][month][day].length; i++) {
                            this.state.matrix[year][month][day][i] = new JSCalendarEvent(this.state.matrix[year][month][day][i], this, year + "-" + month + "-" + day);
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
    }, {
        key: "debug",
        value: function debug() {
            var matrix = {};

            for (var day in this.state.matrix[this.state.year][this.state.month]) {
                var _events = this.state.matrix[this.state.year][this.state.month][day];
                matrix[day] = _events.map(function (e) {
                    return {
                        displayname: e.displayname,
                        at: new Date(e.at),
                        duration: e.duration
                    };
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
    }, {
        key: "fetch",
        value: function fetch(done, force) {
            var _this9 = this;

            if (!force && this.state.matrix[this.state.year] && this.state.matrix[this.state.year][this.state.month]) {
                _jscallog("Loading matrix from local cache");
                done && done();
            } else if (this.options.datasource) {
                var request = new XMLHttpRequest();
                for (var header in this.options.datasourceHeaders) {
                    request.setRequestHeader(header, this.options.datasourceHeaders[header]);
                }

                var daystamp = 1000 * 60 * 60 * 24;
                var dim = JSCalendar.getDaysInMonth(this.state.year, this.state.month);

                var from = new Date(this.state.year, this.state.month, 1);
                var to = new Date(this.state.year, this.state.month, dim.numberOfDays);

                var firstStamp = from.getTime() - from.getDay() * daystamp;
                var endStamp = to.getTime() + (6 - to.getDay()) * daystamp + daystamp - 1;

                var url = this.options.datasource;
                url += (url.indexOf('?') != -1 ? "&" : "?") + "year=" + this.state.year + "&month=" + this.state.month + "&day=" + this.state.day + "&view=" + this.state.view + "&startstamp=" + firstStamp + "&endstamp=" + endStamp;

                var evObject = { url: url };
                this.fire('willFetch', evObject);
                request.onreadystatechange = function () {
                    if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                        try {
                            var maybeMatrix = JSON.parse(request.responseText);
                            _this9.fire('fetched', maybeMatrix);

                            if (_this9.options.fetchReplaces ? _this9.setMatrix(maybeMatrix) : _this9.appendMatrix(maybeMatrix)) {
                                _jscallog("Updated matrix from data source");
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

    }], [{
        key: "getDaysInMonth",
        value: function getDaysInMonth(year, month) {
            var isLeap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
            return {
                numberOfDays: [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month],
                firstDay: new Date(year, month).getDay()
            };
        }
    }, {
        key: "on",
        value: function on(event, callback) {
            JSCalendar.hooks[event] = JSCalendar.hooks[event] || [];
            JSCalendar.hooks[event].push(callback);
        }
    }, {
        key: "fire",
        value: function fire(event, instance, extra) {
            var events = JSCalendar.hooks[event] || [];
            events.forEach(function (e) {
                e(instance, extra);
            });
        }
    }, {
        key: "emptyElem",
        value: function emptyElem(elem) {
            if (elem) while (elem.firstElementChild) {
                elem.firstElementChild.remove();
            }
        }
    }, {
        key: "defaultMatrix",
        value: function defaultMatrix() {
            var _ref;

            var year = new Date().getFullYear();
            return _ref = {}, _defineProperty(_ref, year - 1, {
                0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {},
                6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
            }), _defineProperty(_ref, year, {
                0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
            }), _defineProperty(_ref, year + 1, {
                0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}
            }), _ref;
        }
    }, {
        key: "createState",
        value: function createState() {
            var now = new Date();
            return {
                view: "month",

                matrix: JSCalendar.defaultMatrix(),
                matrixmonth: now.getMonth(),

                year: now.getFullYear(),
                month: now.getMonth(), // has array padding, 0 is January
                day: now.getDate(),
                weekday: now.getDay(), // has array padding, 0 is Sunday

                dragging: false
            };
        }
    }, {
        key: "getInstance",
        value: function getInstance(id) {
            return _jsCalWrapper.instances[id];
        }
    }, {
        key: "find",
        value: function find(wrapper) {
            var calendarElems = (wrapper || document)["querySelectorAll"](JSCalendar.defaultOptions.globalSelector);
            for (var i = 0; i < calendarElems.length; i++) {
                var elem = calendarElems[i];
                var id = elem.id || "js-calendar-" + i;
                _jsCalWrapper.instances[id] = new JSCalendar(elem).init();
            }

            return JSCalendar;
        }
    }, {
        key: "defaultOptions",
        get: function get() {
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
                monthsVocab: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
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
    }]);

    return JSCalendar;
}();

JSCalendar.hooks = {};

(function () {
    module.exports = { JSCalendar: JSCalendar, JSCalendarEvent: JSCalendarEvent };
})(JSCalendar, JSCalendarEvent);
