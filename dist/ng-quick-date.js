(function() {
    // ngQuickDate
  // originally by Adam Albrecht
  // http://adamalbrecht.com
  // modified by Ken Wang

  // Source Code: https://github.com/gildorwang/ngQuickDate

  // Compatible with Angular 1.3.0+

  var app;

  app = angular.module("ngQuickDate", []);

  app.provider("ngQuickDateDefaults", function() {
    return {
      options: {
        stdWeek: false, // Makes Monday the first day of the week
        dateFormat: 'M/d/yyyy',
        timeFormat: 'h:mm a',
        labelFormat: null,
        placeholder: 'Click to Set Date',
        hoverText: null,
        buttonIconHtml: null,
        closeButtonHtml: '&times;',
        nextLinkHtml: 'Next &rarr;',
        prevLinkHtml: '&larr; Prev',
        disableTimepicker: false,
        disableClearButton: false,
        defaultTime: null,
        dayAbbreviations: ["Su", "M", "Tu", "W", "Th", "F", "Sa"],
        dateFilter: null,
        timezone: null,
        debug: false,
        parseDateFunction: function(str) {
          var seconds;
          seconds = Date.parse(str);
          if (isNaN(seconds)) {
            return null;
          } else {
            return new Date(seconds);
          }
        }
      },
      $get: function() {
        return this.options;
      },
      set: function(keyOrHash, value) {
        var k, results, v;
        if (typeof keyOrHash === 'object') {
          results = [];
          for (k in keyOrHash) {
            v = keyOrHash[k];
            results.push(this.options[k] = v);
          }
          return results;
        } else {
          return this.options[keyOrHash] = value;
        }
      }
    };
  });

  app.directive("quickDatepicker", [
    'ngQuickDateDefaults',
    '$filter',
    '$sce',
    '$log',
    function(ngQuickDateDefaults,
    $filter,
    $sce,
    $log) {
      return {
        restrict: "E",
        require: "?ngModel",
        scope: {
          dateFilter: '=?',
          disableTimepicker: '=?',
          disableClearButton: '=?',
          timezone: '=?',
          onChange: "&",
          required: '@',
          debug: '=?'
        },
        replace: true,
        link: function(scope,
    element,
    attrs,
    ngModelCtrl) {
          var addMonth,
    combineDateAndTime,
    dateToString,
    datepickerClicked,
    datesAreEqual,
    datesAreEqualToMinute,
    debounce,
    debugLog,
    emptyTime,
    getDate,
    getDay,
    getDaysInMonth,
    getFullYear,
    getHours,
    getMilliseconds,
    getMinutes,
    getMonth,
    getSeconds,
    initialize,
    isUTC,
    parseDateString,
    refreshView,
    setCalendarDate,
    setConfigOptions,
    setDate,
    setFullYear,
    setHours,
    setInputFieldValues,
    setMilliseconds,
    setMinutes,
    setMonth,
    setSeconds,
    setTime,
    setupCalendarView,
    stringToDate,
    templateDate;
          emptyTime = '00:00:00';
          debugLog = function(message) {
            if (scope.debug) {
              return $log.debug("[quickdate] " + message);
            }
          };
          templateDate = new Date("2015-01-01T12:00Z");
          // INITIALIZE VARIABLES AND CONFIGURATION
          // ================================
          initialize = function() {
            setConfigOptions(); // Setup configuration variables
            scope.toggleCalendar(false); // Make sure it is closed initially
            scope.weeks = []; // Nested Array of visible weeks / days in the popup
            scope.inputDate = null; // Date inputted into the date text input field
            scope.inputTime = null; // Time inputted into the time text input field
            scope.invalid = true;
            if (typeof attrs.initValue === 'string') {
              ngModelCtrl.$setViewValue(attrs.initValue);
            }
            setCalendarDate();
            return refreshView();
          };
          scope.getDatePlaceholder = function() {
            return dateToString(templateDate,
    scope.getDateFormat());
          };
          scope.getTimePlaceholder = function() {
            return dateToString(templateDate,
    scope.getTimeFormat());
          };
          // Use the ISO formats if timezone is UTC.
          // This is necessary to ensure the date string is parsed in correct timezone.
          scope.getDateFormat = function() {
            if (isUTC()) {
              return "yyyy-MM-dd";
            } else {
              return scope.dateFormat;
            }
          };
          scope.getTimeFormat = function() {
            if (isUTC()) {
              return "HH:mm:ss";
            } else {
              return scope.timeFormat;
            }
          };
          scope.getLabelFormat = function() {
            var ref;
            return (ref = scope.labelFormat) != null ? ref : scope.disableTimepicker ? scope.getDateFormat() : scope.getDateFormat() + " " + scope.getTimeFormat();
          };
          // Copy various configuration options from the default configuration to scope
          setConfigOptions = function() {
            var key,
    ref,
    value;
            for (key in ngQuickDateDefaults) {
              value = ngQuickDateDefaults[key];
              if (key.match(/[Hh]tml/)) {
                scope[key] = $sce.trustAsHtml(ngQuickDateDefaults[key] || "");
              } else if (scope[key] == null) {
                scope[key] = (ref = attrs[key]) != null ? ref : ngQuickDateDefaults[key];
              }
            }
            if (attrs.iconClass && attrs.iconClass.length) {
              return scope.buttonIconHtml = $sce.trustAsHtml(`<i ng-show='iconClass' class='${attrs.iconClass}'></i>`);
            }
          };
          // VIEW SETUP
          // ================================

          // This code listens for clicks both on the entire document and the popup.
          // If a click on the document is received but not on the popup, the popup
          // should be closed
          datepickerClicked = false;
          window.document.addEventListener('click',
    function(event) {
            if (scope.calendarShown && !datepickerClicked) {
              scope.toggleCalendar(false);
              scope.$apply();
            }
            return datepickerClicked = false;
          });
          angular.element(element[0])[0].addEventListener('click',
    function(event) {
            return datepickerClicked = true;
          });
          // SCOPE MANIPULATION Methods
          // ================================

          // Refresh the calendar, the input dates, and the button date
          refreshView = function() {
            var date;
            date = ngModelCtrl.$modelValue ? parseDateString(ngModelCtrl.$modelValue) : null;
            setupCalendarView();
            setInputFieldValues(date);
            scope.mainButtonStr = date ? dateToString(date,
    scope.getLabelFormat()) : scope.placeholder;
            return scope.invalid = ngModelCtrl.$invalid;
          };
          // Set the values used in the 2 input fields
          setInputFieldValues = function(val) {
            if (val != null) {
              scope.inputDate = dateToString(val,
    scope.getDateFormat());
              return scope.inputTime = dateToString(val,
    scope.getTimeFormat());
            } else {
              scope.inputDate = null;
              return scope.inputTime = null;
            }
          };
          // Set the date that is used by the calendar to determine which month to show
          // Defaults to the current month
          setCalendarDate = function(val = null) {
            var d;
            d = val != null ? new Date(val) : new Date();
            if (d.toString() === "Invalid Date") {
              d = new Date();
            }
            setDate(d,
    1);
            return scope.calendarDate = d;
          };
          // Setup the data needed by the table that makes up the calendar in the popup
          // Uses scope.calendarDate to decide which month to show
          setupCalendarView = function() {
            var curDate,
    d,
    day,
    daysInMonth,
    i,
    j,
    numRows,
    offset,
    ref,
    row,
    selected,
    today,
    weeks;
            offset = getDay(scope.calendarDate);
            if (scope.stdWeek) {
              offset = offset ? offset - 1 : 6;
            }
            daysInMonth = getDaysInMonth(getFullYear(scope.calendarDate),
    getMonth(scope.calendarDate));
            numRows = Math.ceil((offset + daysInMonth) / 7);
            weeks = [];
            curDate = new Date(scope.calendarDate);
            setDate(curDate,
    getDate(curDate) + (offset * -1));
            for (row = i = 0, ref = numRows - 1; (0 <= ref ? i <= ref : i >= ref); row = 0 <= ref ? ++i : --i) {
              weeks.push([]);
              for (day = j = 0; j <= 6; day = ++j) {
                d = new Date(curDate);
                setTime(d,
    emptyTime);
                selected = ngModelCtrl.$modelValue && d && datesAreEqual(d,
    ngModelCtrl.$modelValue);
                today = datesAreEqual(d,
    new Date());
                weeks[row].push({
                  date: d,
                  selected: selected,
                  disabled: (typeof scope.dateFilter === 'function') ? !scope.dateFilter(d) : false,
                  other: getMonth(d) !== getMonth(scope.calendarDate),
                  today: today
                });
                setDate(curDate,
    getDate(curDate) + 1);
              }
            }
            return scope.weeks = weeks;
          };
          // PARSERS AND FORMATTERS
          // =================================
          // When the model is set from within the datepicker, this will be run
          // before passing it to the model.
          ngModelCtrl.$parsers.push(function(viewVal) {
            if (scope.required && (viewVal == null)) {
              ngModelCtrl.$setValidity('required',
    false);
              return null;
            } else if (angular.isDate(viewVal)) {
              ngModelCtrl.$setValidity('required',
    true);
              return viewVal;
            } else if (angular.isString(viewVal)) {
              ngModelCtrl.$setValidity('required',
    true);
              return scope.parseDateFunction(viewVal);
            } else {
              return null;
            }
          });
          // When the model is set from outside the datepicker, this will be run
          // before passing it to the datepicker
          ngModelCtrl.$formatters.push(function(modelVal) {
            if (angular.isDate(modelVal)) {
              return modelVal;
            } else if (angular.isString(modelVal)) {
              return scope.parseDateFunction(modelVal);
            } else {
              return void 0;
            }
          });
          // HELPER METHODS
          // =================================
          isUTC = function() {
            return scope.timezone === "UTC";
          };
          getDate = function(date) {
            if (isUTC()) {
              return date.getUTCDate();
            } else {
              return date.getDate();
            }
          };
          getDay = function(date) {
            if (isUTC()) {
              return date.getUTCDay();
            } else {
              return date.getDay();
            }
          };
          getFullYear = function(date) {
            if (isUTC()) {
              return date.getUTCFullYear();
            } else {
              return date.getFullYear();
            }
          };
          getHours = function(date) {
            if (isUTC()) {
              return date.getUTCHours();
            } else {
              return date.getHours();
            }
          };
          getMilliseconds = function(date) {
            if (isUTC()) {
              return date.getUTCMilliseconds();
            } else {
              return date.getMilliseconds();
            }
          };
          getMinutes = function(date) {
            if (isUTC()) {
              return date.getUTCMinutes();
            } else {
              return date.getMinutes();
            }
          };
          getMonth = function(date) {
            if (isUTC()) {
              return date.getUTCMonth();
            } else {
              return date.getMonth();
            }
          };
          getSeconds = function(date) {
            if (isUTC()) {
              return date.getUTCSeconds();
            } else {
              return date.getSeconds();
            }
          };
          setDate = function(date,
    val) {
            if (isUTC()) {
              return date.setUTCDate(val);
            } else {
              return date.setDate(val);
            }
          };
          setFullYear = function(date,
    val) {
            if (isUTC()) {
              return date.setUTCFullYear(val);
            } else {
              return date.setFullYear(val);
            }
          };
          setHours = function(date,
    val) {
            if (isUTC()) {
              return date.setUTCHours(val);
            } else {
              return date.setHours(val);
            }
          };
          setMilliseconds = function(date,
    val) {
            if (isUTC()) {
              return date.setUTCMilliseconds(val);
            } else {
              return date.setMilliseconds(val);
            }
          };
          setMinutes = function(date,
    val) {
            if (isUTC()) {
              return date.setUTCMinutes(val);
            } else {
              return date.setMinutes(val);
            }
          };
          setMonth = function(date,
    val) {
            if (isUTC()) {
              return date.setUTCMonth(val);
            } else {
              return date.setMonth(val);
            }
          };
          setSeconds = function(date,
    val) {
            if (isUTC()) {
              return date.setUTCSeconds(val);
            } else {
              return date.setSeconds(val);
            }
          };
          setTime = function(date,
    val) {
            var parts,
    ref,
    ref1,
    ref2;
            parts = (val != null ? val : emptyTime).split(':');
            setHours(date,
    (ref = parts[0]) != null ? ref : 0);
            setMinutes(date,
    (ref1 = parts[1]) != null ? ref1 : 0);
            setSeconds(date,
    (ref2 = parts[2]) != null ? ref2 : 0);
            return date;
          };
          addMonth = function(date,
    val) {
            return new Date(setMonth(new Date(date),
    getMonth(date) + val));
          };
          dateToString = function(date,
    format) {
            return $filter('date')(date,
    format,
    scope.timezone);
          };
          stringToDate = function(date) {
            if (typeof date === 'string') {
              return parseDateString(date);
            } else {
              return date;
            }
          };
          parseDateString = ngQuickDateDefaults.parseDateFunction;
          combineDateAndTime = function(date,
    time) {
            if (isUTC()) {
              return `${date}T${time}Z`;
            } else {
              return `${date} ${time}`;
            }
          };
          datesAreEqual = function(d1,
    d2,
    compareTimes = false) {
            if (compareTimes) {
              return (d1 - d2) === 0;
            } else {
              d1 = stringToDate(d1);
              d2 = stringToDate(d2);
              return d1 && d2 && (getFullYear(d1) === getFullYear(d2)) && (getMonth(d1) === getMonth(d2)) && (getDate(d1) === getDate(d2));
            }
          };
          datesAreEqualToMinute = function(d1,
    d2) {
            if (!(d1 && d2)) {
              return false;
            }
            return parseInt(d1.getTime() / 60000) === parseInt(d2.getTime() / 60000);
          };
          getDaysInMonth = function(year,
    month) {
            return [31,
    (((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 29 : 28),
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31][month];
          };
          // Executes a function one time per N milliseconds (wait)
          debounce = function(func,
    wait) {
            var args,
    context,
    later,
    result,
    timeout,
    timestamp;
            timeout = args = context = timestamp = result = null;
            later = function() {
              var last;
              last = +new Date() - timestamp;
              if (last < wait && last > 0) {
                return timeout = setTimeout(later,
    wait - last);
              } else {
                return timeout = null;
              }
            };
            return function() {
              context = this;
              args = arguments;
              timestamp = +new Date();
              if (!timeout) {
                timeout = setTimeout(later,
    wait);
                result = func.apply(context,
    args);
                context = args = null;
              }
              return result;
            };
          };
          // DATA WATCHES
          // ==================================

          // Called when the model is updated from outside the datepicker
          ngModelCtrl.$render = function() {
            setCalendarDate(ngModelCtrl.$viewValue);
            return refreshView();
          };
          // Called when the model is updated from inside the datepicker,
          // either by clicking a calendar date, setting an input, etc
          ngModelCtrl.$viewChangeListeners.unshift(function() {
            setCalendarDate(ngModelCtrl.$viewValue);
            refreshView();
            if (scope.onChange) {
              return scope.onChange();
            }
          });
          // When the popup is toggled open, select the date input
          scope.$watch('calendarShown',
    function(newVal,
    oldVal) {
            var dateInput;
            if (newVal) {
              dateInput = angular.element(element[0].querySelector(".quickdate-date-input"))[0];
              dateInput.select();
              return refreshView();
            }
          });
          // When the timezone is changed, refresh the view
          scope.$watch('timezone',
    function(newVal,
    oldVal) {
            if (newVal === oldVal) {
              return;
            }
            return ngModelCtrl.$render();
          });
          // When the option disableTimepicker is changed, refresh the view
          scope.$watch('disableTimepicker',
    function(newVal,
    oldVal) {
            if (newVal === oldVal) {
              return;
            }
            return refreshView();
          });
          // VIEW ACTIONS
          // ==================================
          scope.toggleCalendar = debounce(function(show) {
            if (angular.element(element).attr('disabled')) {
              show = false;
            }
            if (isFinite(show)) {
              return scope.calendarShown = show;
            } else {
              return scope.calendarShown = !scope.calendarShown;
            }
          },
    150);
          // Select a new model date. This is called in 3 situations:
          //   * Clicking a day on the calendar, which calls the `selectDateWithMouse` method, which calls this method.
          //   * Changing the date or time inputs, which calls the `selectDateFromInput` method, which calls this method.
          //   * The clear button is clicked.
          scope.selectDate = function(date,
    closeCalendar = true) {
            var changed;
            debugLog(`selectDate: ${date != null ? date.toISOString() : void 0}`);
            changed = (!ngModelCtrl.$viewValue && date) || (ngModelCtrl.$viewValue && !date) || ((date && ngModelCtrl.$viewValue) && (date.getTime() !== ngModelCtrl.$viewValue.getTime()));
            if (typeof scope.dateFilter === 'function' && !scope.dateFilter(date)) {
              return false;
            }
            ngModelCtrl.$setViewValue(date);
            if (closeCalendar) {
              scope.toggleCalendar(false);
            }
            return true;
          };
          scope.selectDateWithMouse = function(date) {
            // change the input date
            scope.inputDate = dateToString(date,
    scope.getDateFormat());
            // close the calendar only when the time picker is disabled
            return scope.selectDateFromInput(scope.disableTimepicker);
          };
          // This is triggered when the date or time inputs have a blur or enter event.
          scope.selectDateFromInput = function(closeCalendar = false) {
            var err,
    ref,
    tmpDate,
    tmpDateAndTime,
    tmpTime;
            try {
              tmpDate = parseDateString(combineDateAndTime(scope.inputDate,
    scope.defaultTime || emptyTime));
              if (tmpDate == null) {
                throw new Error('Invalid Date');
              }
              if (!scope.disableTimepicker && ((ref = scope.inputTime) != null ? ref.length : void 0)) {
                tmpTime = scope.disableTimepicker ? emptyTime : scope.inputTime;
                tmpDateAndTime = parseDateString(combineDateAndTime(scope.inputDate,
    tmpTime));
                if (tmpDateAndTime == null) {
                  throw new Error('Invalid Time');
                }
                tmpDate = tmpDateAndTime;
              }
              if (!datesAreEqualToMinute(ngModelCtrl.$viewValue,
    tmpDate)) {
                if (!scope.selectDate(tmpDate,
    false)) {
                  throw new Error('Invalid Date');
                }
              }
              if (closeCalendar) {
                scope.toggleCalendar(false);
              }
              scope.inputDateErr = false;
              return scope.inputTimeErr = false;
            } catch (error) {
              err = error;
              if (err.message === 'Invalid Date') {
                return scope.inputDateErr = true;
              } else if (err.message === 'Invalid Time') {
                return scope.inputTimeErr = true;
              }
            }
          };
          // When tab is pressed from the date input and the timepicker
          // is disabled, close the popup
          scope.onDateInputTab = function() {
            if (scope.disableTimepicker) {
              scope.toggleCalendar(false);
            }
            return true;
          };
          // When tab is pressed from the time input, close the popup
          scope.onTimeInputTab = function() {
            scope.toggleCalendar(false);
            return true;
          };
          // View the next and previous months in the calendar popup
          scope.nextMonth = function() {
            setCalendarDate(addMonth(scope.calendarDate,
    1));
            return refreshView();
          };
          scope.prevMonth = function() {
            setCalendarDate(addMonth(scope.calendarDate,
    -1));
            return refreshView();
          };
          // Set the date model to null
          scope.clear = function() {
            return scope.selectDate(null,
    true);
          };
          return initialize();
        },
        // TEMPLATE
        // ================================================================
        template: `<div class='quickdate'>
  <a href='' ng-focus='toggleCalendar()' ng-click='toggleCalendar()'
      class='quickdate-button' title='{{hoverText}}'><div ng-hide='iconClass' ng-bind-html='buttonIconHtml'></div>{{mainButtonStr}}</a>
  <div class='quickdate-popup' ng-class='{open: calendarShown}'>
    <a href='' tabindex='-1' class='quickdate-close' ng-click='toggleCalendar()'>
      <div ng-bind-html='closeButtonHtml'></div>
    </a>
    <div class='quickdate-text-inputs'>
      <div class='quickdate-input-wrapper'>
        <label>Date</label>
        <input class='quickdate-date-input' ng-class="{'ng-invalid': inputDateErr}"
               name='inputDate' type='text' ng-model='inputDate'
               placeholder='{{ getDatePlaceholder() }}'
               ng-enter="selectDateFromInput(true)"
               ng-blur="selectDateFromInput(false)"
               on-tab='onDateInputTab()' />
      </div>
      <div class='quickdate-input-wrapper' ng-hide='disableTimepicker'>
        <label>Time</label>
        <input class='quickdate-time-input'
               ng-class="{'ng-invalid': inputTimeErr}"
               name='inputTime'
               type='text'
               ng-model='inputTime'
               placeholder='{{ getTimePlaceholder() }}'
               ng-enter="selectDateFromInput(true)"
               ng-blur="selectDateFromInput(false)"
               on-tab='onTimeInputTab()'>
      </div>
    </div>
    <div class='quickdate-calendar-header'>
      <a href='' class='quickdate-prev-month quickdate-action-link' tabindex='-1' ng-click='prevMonth()'>
        <div ng-bind-html='prevLinkHtml'></div>
      </a>
      <span class='quickdate-month'>{{calendarDate | date:'MMMM yyyy'}}</span>
      <a href='' class='quickdate-next-month quickdate-action-link' ng-click='nextMonth()' tabindex='-1' >
        <div ng-bind-html='nextLinkHtml'></div>
      </a>
    </div>
    <table class='quickdate-calendar'>
      <thead>
        <tr>
          <th ng-repeat='day in dayAbbreviations'>{{day}}</th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat='week in weeks'>
          <td ng-mousedown='selectDateWithMouse(day.date)'
              ng-click='$event.preventDefault()'
              ng-class='{"other-month": day.other, "disabled-date": day.disabled, "selected": day.selected, "is-today": day.today}'
              ng-repeat='day in week'>{{day.date | date:'d':timezone}}</td>
        </tr>
      </tbody>
    </table>
    <div class='quickdate-popup-footer'>
      <a href='' class='quickdate-clear' tabindex='-1' ng-hide='disableClearButton' ng-click='clear()'>Clear</a>
    </div>
  </div>
</div>`
      };
    }
  ]);

  app.directive('ngEnter', function() {
    return function(scope, element, attr) {
      return element.bind('keydown keypress', function(e) {
        if (e.which === 13) {
          scope.$apply(attr.ngEnter);
          return e.preventDefault();
        }
      });
    };
  });

  app.directive('onTab', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        return element.bind('keydown keypress', function(e) {
          if ((e.which === 9) && !e.shiftKey) {
            return scope.$apply(attr.onTab);
          }
        });
      }
    };
  });

}).call(this);
