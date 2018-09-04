angular.module('ez.timepicker', [])

.constant('TimepickerConfig', {
  mode                : 'default',
  yearStep            : 1,
  monthStep           : 1,
  dayStep             : 1,
  hourStep            : 1,
  minuteStep          : 1,
  secondStep          : 1,
  meridians           : ['AM', 'PM'],
  showYear            : 'true',
  showMonth           : 'true',
  showDay             : 'true',
  showHour            : 'true',
  showMinute          : 'true',
  showSecond          : 'true',
  showMeridian        : 'false',
  inputContainerClass : 'input-group',
  incIconClass        : 'icon-chevron-up',
  decIconClass        : 'icon-chevron-down',
  zeroValue           : 'PT0S'
})

.directive('ezTimepicker', ['TimepickerConfig', '$log', function(TimepickerConfig, $log) {
  return {
    restrict: 'AE',
    replace: true,
    transclude: 'element',
    templateUrl: 'ez-timepicker.html',
    scope: {
      // same as ezTimepicker: '=', but with another name
      time: '=ezTimepicker',
    },
    link: function(scope, element, attrs) {
      _scope = scope;
      _element = element;
      _attrs = attrs;
      scope.iso8601Regex        = /^[\+\-]?P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d+[HMS])(\d+H)?(\d+M)?(\d+S)?)?$/;
      scope.mode                = attrs.mode || TimepickerConfig.mode;
      scope.yearStep            = parseInt(attrs.yearStep, 1) || TimepickerConfig.yearStep;
      scope.monthStep           = parseInt(attrs.monthStep, 1) || TimepickerConfig.monthStep;
      scope.dayStep             = parseInt(attrs.dayStep, 1) || TimepickerConfig.dayStep;
      scope.hourStep            = parseInt(attrs.hourStep, 1) || TimepickerConfig.hourStep;
      scope.minuteStep          = parseInt(attrs.minuteStep, 1) || TimepickerConfig.minuteStep;
      scope.secondStep          = parseInt(attrs.secondStep, 1) || TimepickerConfig.secondStep;
      scope.showYear            = scope.$eval(attrs.showYear || TimepickerConfig.showYear);
      scope.showMonth           = scope.$eval(attrs.showMonth || TimepickerConfig.showMonth);
      scope.showDay             = scope.$eval(attrs.showDay || TimepickerConfig.showDay);
      scope.showHour            = scope.$eval(attrs.showHour || TimepickerConfig.showHour);
      scope.showMinute          = scope.$eval(attrs.showMinute || TimepickerConfig.showMinute);
      scope.showSecond          = scope.$eval(attrs.showSecond || TimepickerConfig.showSecond);
      scope.showMeridian        = scope.$eval(attrs.showMeridian || TimepickerConfig.showMeridian);
      scope.meridians           = attrs.meridians || TimepickerConfig.meridians;
      scope.inputContainerClass = attrs.inputContainerClass || TimepickerConfig.inputContainerClass;
      scope.incIconClass        = attrs.incIconClass || TimepickerConfig.incIconClass;
      scope.decIconClass        = attrs.decIconClass || TimepickerConfig.decIconClass;
      scope.zeroValue           = attrs.zeroValue || TimepickerConfig.zeroValue;
      scope.widget              = {
        years : 0,
        months : 0,
        days : 0
      };

      var checkMode = function(mode, input) {
        var defaultDetected = false;
        var isoDetected = false;
        if(input.length > 0 && input.indexOf(':') !== -1) {
          defaultDetected = true;
        }
        if(input.length > 0 && input.indexOf('P') === 0) {
          isoDetected = true;
        }
        if(defaultDetected && !isoDetected) {
          return 'default';
        }
        if(!defaultDetected && isoDetected) {
          return 'iso8601';
        }
        return mode;
      };

      if(scope.time.length > 0 && scope.time.indexOf(':') === -1) {
        if(scope.mode !== 'iso8601') {
          $log.warn('Input value does not looks like default duration. Changing mode to ISO8601.');
        }
        scope.mode = 'iso8601';
      }
      if(scope.time.length > 0 && scope.time.indexOf('P') !== 0) {
        if(scope.mode !== 'default') {
          $log.warn('Input value does not looks like ISO8601. Changing mode to default.');
        }
        scope.mode = 'default';
      }

      scope.preventDefault = function(e) {
        e.preventDefault();
        e.stopPropagation();
      };

      scope.incrementYears = function() {
        scope.widget.years ++;
      };

      scope.decrementYears = function() {
        if (scope.widget.years > 0) {
          scope.widget.years --;
        }
      };

      scope.incrementMonths = function() {
        scope.widget.months ++;
        if (scope.widget.months === 13) {
          scope.incrementYears();
          scope.widget.months = 1;
        }
      };

      scope.decrementMonths = function() {
        if (parseInt(scope.widget.months, 10)) {
          scope.widget.months --;
        } else {
          scope.decrementYears();
          scope.widget.months = 12;
        }
      };

      scope.incrementDays = function() {
        scope.widget.days ++;
        if (scope.widget.days === 32 && scope.showMonth) {
          scope.incrementMonths();
          scope.widget.days = 1;
        }
      };

      scope.decrementDays = function() {
        if (parseInt(scope.widget.days, 10)) {
          scope.widget.days --;
        } else {
          scope.decrementMonths();
          scope.widget.days = 31;
        }
      };

      scope.incrementHours = function() {
        if (scope.showMeridian) {
          if (scope.widget.hours === 11) {
            scope.widget.hours++;
            if (scope.widget.meridians === 'PM') {
              scope.incrementDays();
              scope.widget.hours = 0;
            }
            scope.toggleMeridian();
          } else if (scope.widget.hours === 12) {
            scope.widget.hours = 1;
          } else {
            scope.widget.hours++;
          }
        } else {
          if (scope.widget.hours === 23) {
            scope.widget.hours = 0;
            scope.incrementDays();
          } else {
            scope.widget.hours++;
          }
        }
        formatHours();
      };

      scope.decrementHours = function() {
        if (parseInt(scope.widget.hours, 10)) {
          scope.widget.hours --;
        } else {
          if (scope.showMeridian) {
            scope.widget.hours = 12;
          } else {
            scope.widget.hours = 23;
          }
          if (scope.widget.meridians === 'AM') {
            scope.decrementDays();
          }
        }

        if (scope.widget.hours === 11 && scope.showMeridian) {
          scope.toggleMeridian();
        }
        formatHours();
      };

      scope.incrementMinutes = function() {
        scope.widget.minutes = parseInt(scope.widget.minutes, 10) + scope.minuteStep;
        if (scope.widget.minutes >= 60) {
          scope.widget.minutes = 0;
          scope.incrementHours();
        }
        formatMinutes();
      };

      scope.decrementMinutes = function() {
        scope.widget.minutes = scope.widget.minutes - scope.minuteStep;
        if (parseInt(scope.widget.minutes, 10) < 0) {
          scope.decrementHours();
          scope.widget.minutes += 60;
        }
        formatMinutes();
      };

      scope.incrementSeconds = function() {
        scope.widget.seconds = parseInt(scope.widget.seconds, 10) + scope.secondStep;
        if (scope.widget.seconds >= 60) {
          scope.widget.seconds = 0;
          scope.incrementMinutes();
        }
        formatSeconds();
      };

      scope.decrementSeconds = function() {
        scope.widget.seconds = scope.widget.seconds - scope.secondStep;
        if (parseInt(scope.widget.seconds, 10) < 0) {
          scope.decrementMinutes();
          scope.widget.seconds += 60;
        }
        formatSeconds();
      };

      scope.toggleMeridian = function() {
        if (scope.widget.meridian === scope.meridians[0]) {
          scope.widget.meridian = scope.meridians[1];
        } else {
          scope.widget.meridian = scope.meridians[0];
        }
      };

      var formatHours = function() {
        if (parseInt(scope.widget.hours, 10) < 10) {
          scope.widget.hours = '0' + parseInt(scope.widget.hours, 10);
        }
      };

      var formatMinutes = function() {
        if (parseInt(scope.widget.minutes, 10) >= 60) {
          scope.widget.minutes = 0;
          scope.incrementHours();
        }

        if (parseInt(scope.widget.minutes, 10) < 10) {
          scope.widget.minutes = '0' + parseInt(scope.widget.minutes, 10);
        }
      };

      var formatSeconds = function() {
        if (parseInt(scope.widget.seconds, 10) >= 60) {
          scope.widget.seconds = 0;
          scope.incrementMinutes();
        }

        if (parseInt(scope.widget.seconds, 10) < 10) {
          scope.widget.seconds = '0' + parseInt(scope.widget.seconds, 10);
        }
      };

      var formatOutputDefault = function() {
        scope.time = scope.widget.hours + ':' + scope.widget.minutes + ':' + scope.widget.seconds;

        if (scope.showDay && scope.widget.days) {
          scope.time = scope.widget.days + ' days ' + scope.time;
        }

        if (scope.showMonth && scope.widget.months) {
          scope.time = scope.widget.months + (scope.widget.months > 1 ? ' months ' : ' month ') + scope.time;
        }

        if (scope.showYear && scope.widget.years) {
          scope.time = scope.widget.years + (scope.widget.years > 1 ? ' years ' : ' year ') + scope.time;
        }

        if (scope.showMeridian) {
          scope.time = scope.time + ' ' + scope.widget.meridian;
        }
      };

      var formatOutputIso8601 = function() {
        // borrowed from: https://unpkg.com/ngx-duration-picker@1.4.1/bundles/ngx-duration-picker.umd.js
        // https://github.com/ShinDarth/ngx-duration-picker/blob/master/src/app/duration-picker/duration-picker.component.ts#L184
        var output = 'P';
        var years, months, weeks, days, hours, minutes, seconds;

        years   = parseInt(scope.widget.years, 10);
        months  = parseInt(scope.widget.months, 10);
        weeks   = parseInt(scope.widget.weeks, 10);
        days    = parseInt(scope.widget.days, 10);
        hours   = parseInt(scope.widget.hours, 10);
        minutes = parseInt(scope.widget.minutes, 10);
        seconds = parseInt(scope.widget.seconds, 10);

        if (isNaN(years))   { years = 0; }
        if (isNaN(months))  { months = 0; }
        if (isNaN(weeks))   { weeks = 0; }
        if (isNaN(days))    { days = 0; }
        if (isNaN(hours))   { hours = 0; }
        if (isNaN(minutes)) { minutes = 0; }
        if (isNaN(seconds)) { seconds = 0; }

        if (scope.showYear && years) {
            output += years + "Y";
        }
        if (scope.showMonth && months) {
            output += months + "M";
        }
        if (scope.showWeek && weeks) {
            output += weeks + "W";
        }
        if (scope.showDay && days) {
            output += days + "D";
        }
        if ((scope.showHour && hours)
            || (scope.showMinute && minutes)
            || (scope.showSecond && seconds)) {
            output += 'T';
            if (scope.showHour && hours) {
                output += hours + "H";
            }
            if (scope.showMinute && minutes) {
                output += minutes + "M";
            }
            if (scope.showSecond && seconds) {
                output += seconds + "S";
            }
        }
        // if all values are empty, just output null
        if (output === 'P' || output === '-P') {
            output = scope.zeroValue;
        }
        scope.time = output;
      };

      var updateModel = function() {
        if (angular.isDefined(scope.widget.hours) && angular.isDefined(scope.widget.minutes)) {
          formatOutput();
          element.find('input').first().val(scope.time);
        } else {
          setTime(scope.time);
        }
      };

      var isScrollingUp = function(e) {
        if (e.originalEvent) {
          e = e.originalEvent;
        }
        var delta = (e.wheelDelta) ? e.wheelDelta : -e.deltaY;
        return (e.detail || delta > 0);
      };

      var scrollYears = function(e) {
        scope.$apply(isScrollingUp(e) ? scope.incrementYears() : scope.decrementYears());
        e.preventDefault();
      };

      var scrollMonths = function(e) {
        scope.$apply(isScrollingUp(e) ? scope.incrementMonths() : scope.decrementMonths());
        e.preventDefault();
      };

      var scrollDays = function(e) {
        scope.$apply(isScrollingUp(e) ? scope.incrementDays() : scope.decrementDays());
        e.preventDefault();
      };

      var scrollHours = function(e) {
        scope.$apply(isScrollingUp(e) ? scope.incrementHours() : scope.decrementHours());
        e.preventDefault();
      };

      var scrollMinutes = function(e) {
        scope.$apply(isScrollingUp(e) ? scope.incrementMinutes() : scope.decrementMinutes());
        e.preventDefault();
      };

      var scrollSeconds = function(e) {
        scope.$apply(isScrollingUp(e) ? scope.incrementSeconds() : scope.decrementSeconds());
        e.preventDefault();
      };

      var scrollMeridian = function(e) {
        scope.$apply(scope.toggleMeridian());
        e.preventDefault();
      };

      var setTimeDefault = function(time) {
        var timeArray, dTime, years, months, days, hours, minutes, seconds;

        if (time) {

          if (time.match(new RegExp(scope.meridians[1].substring(0,1), 'i'))) {
            scope.widget.meridian = scope.meridians[1];
          } else {
            scope.widget.meridian = scope.meridians[0];
          }

          match = /(?:([0-9]*)years?)?(?:([0-9]*)months?)?(?:([0-9]*)days?)?(?:([0-9]*):)?(?:([0-9]*):)?(?:([0-9]*))?/.exec(time.replace(/ /g, ''));

          years = match[1] ? match[1].toString() : '';
          months = match[2] ? match[2].toString() : '';
          days = match[3] ? match[3].toString() : '';
          hours = match[5] ? match[4].toString() : '';
          minutes = match[5] ? match[5].toString() : match[4].toString();
          seconds = match[6] ? match[6].toString() : '';

          if (hours.length > 2) {
            minutes = hours.substr(2, 2);
            hours = hours.substr(0, 2);
          }
          if (minutes.length > 2) {
            minutes = minutes.substr(0, 2);
          }
          if (seconds.length > 2) {
            seconds = seconds.substr(0, 2);
          }

          years   = parseInt(years, 10);
          months  = parseInt(months, 10);
          days    = parseInt(days, 10);
          hours   = parseInt(hours, 10);
          minutes = parseInt(minutes, 10);
          seconds = parseInt(seconds, 10);

          if (isNaN(years))   { years = 0; }
          if (isNaN(months))  { months = 0; }
          if (isNaN(days))    { days = 0; }
          if (isNaN(hours))   { hours = 0; }
          if (isNaN(minutes)) { minutes = 0; }
          if (isNaN(seconds)) { seconds = 0; }

        } else { // set current time
          dTime = new Date();
          years = 0;
          months = 0;
          days = 0;
          hours = dTime.getHours();
          minutes = dTime.getMinutes();
          seconds = dTime.getSeconds();
        }

        if (scope.showMeridian) {
          if (hours === 0) {
            scope.widget.hours = 12;
          } else if (hours > 12) {
            scope.widget.hours = hours - 12;
            if (!scope.widget.meridian) {
              scope.widget.meridian = scope.meridians[1];
            } else {
              scope.widget.meridian = (scope.widget.meridian === scope.meridians[0]) ? scope.meridians[1] : scope.meridians[0];
            }
          } else {
            scope.widget.hours = hours;
          }

        } else {
          scope.widget.hours = hours;
        }

        scope.widget.minutes = Math.ceil(minutes / scope.minuteStep) * scope.minuteStep;
        scope.widget.seconds = Math.ceil(seconds / scope.secondStep) * scope.secondStep;

        formatHours();
        formatMinutes();
        formatSeconds();

        formatOutput();
      };

      var parseNumber = function (value) {
        return value ? parseInt(value, 10) : 0;
      };
      var setTimeIso8601 = function(time) {
        var timeArray, dTime, years, months, weeks, days, hours, minutes, seconds;

        if (time) {

          var /** @type {?} */ match = scope.iso8601Regex.exec(time);
          if (!match) {
              console.error("DurationPicker: invalid initial value: " + time);
              return;
          }
          years = parseNumber(match[1]);
          months = parseNumber(match[2]);
          weeks = parseNumber(match[3]);
          days = parseNumber(match[4]);
          hours = parseNumber(match[6]);
          minutes = parseNumber(match[7]);
          seconds = parseNumber(match[8]);

          if (isNaN(years))   { years = 0; }
          if (isNaN(months))  { months = 0; }
          if (isNaN(weeks))   { weeks = 0; }
          if (isNaN(days))    { days = 0; }
          if (isNaN(hours))   { hours = 0; }
          if (isNaN(minutes)) { minutes = 0; }
          if (isNaN(seconds)) { seconds = 0; }

        } else { // set current time
          dTime = new Date();
          years = 0;
          months = 0;
          weeks = 0;
          days = 0;
          hours = dTime.getHours();
          minutes = dTime.getMinutes();
          seconds = dTime.getSeconds();
        }

        scope.widget.years = years;
        scope.widget.months = months;
        scope.widget.weeks = weeks;
        scope.widget.days = days;
        scope.widget.hours = hours;
        scope.widget.minutes = Math.ceil(minutes / scope.minuteStep) * scope.minuteStep;
        scope.widget.seconds = Math.ceil(seconds / scope.secondStep) * scope.secondStep;

        formatHours();
        formatMinutes();
        formatSeconds();

        formatOutput();
      };

      var modeFunctions = {
        showMeridian: scope.showMeridian,
        default: {
          setTime: setTimeDefault,
          formatOutput: formatOutputDefault
        },
        iso8601: {
          setTime: setTimeIso8601,
          formatOutput: formatOutputIso8601
        }
      };

      var setTime;
      var formatOutput;

      // scope.setTime = setTime;
      // scope.formatOutput = formatOutput;
      var setupMode = function(mode) {
        scope.mode = mode;
        if(mode === "iso8601") {
             modeFunctions.showMeridian = scope.showMeridian;
             scope.showMeridian = false;
        }
        if(mode === "default") {
            scope.showMeridian = modeFunctions.showMeridian;
        }
        setTime = modeFunctions[mode].setTime;
        formatOutput = modeFunctions[mode].formatOutput;

        scope.setTime = setTime;
        scope.formatOutput = formatOutput;
      };

      setupMode(scope.mode);

      // Listen to paste event in input
      var input = element.find('input').first();
      input.on('blur', function() {
        scope.$apply(function() {
          var value = input.val();
          var mode = checkMode(scope.mode, value);
          setupMode(checkMode(scope.mode, value));
          $log.debug("inserted value:", value, scope.mode, mode);
          setTime(input.val());
        });
      });

      scope.$watch('widget', function(val) {
        updateModel();
      }, true);

      scope.$watch('time', function(val) {
        setTime(val);
      }, true);

      element.find('.years-col').on('mousewheel wheel', scrollYears);
      element.find('.months-col').on('mousewheel wheel', scrollMonths);
      element.find('.days-col').on('mousewheel wheel', scrollDays);
      element.find('.hours-col').on('mousewheel wheel', scrollHours);
      element.find('.minutes-col').on('mousewheel wheel', scrollMinutes);
      element.find('.seconds-col').on('mousewheel wheel', scrollSeconds);
      element.find('.meridian-col').on('mousewheel wheel', scrollMeridian);
    }
  };
}])


.run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('ez-timepicker.html',
    "<div class=\"dropdown ez-timepicker-container\">\n" +
    "  <div class=\"dropdown-toggle\" ng-class=\"inputContainerClass\">\n" +
    "    <div class=\"time-input\" ng-transclude></div>\n" +
    "  </div>\n" +
    "  <div class=\"dropdown-menu\" ng-click=\"preventDefault($event)\">\n" +
    "    <div class=\"col years-col\" ng-show=\"showYear\">\n" +
    "      <div class=\"text\">Y</div>\n" +
    "      <div><a class=\"button\" ng-click=\"incrementYears()\"><i ng-class=\"incIconClass\"></i></a></div>\n" +
    "      <div class=\"years-val\">{{ widget.years }}</div>\n" +
    "      <div><a class=\"button\" ng-click=\"decrementYears()\"><i ng-class=\"decIconClass\"></i></a></div>\n" +
    "    </div>\n" +
    "    <div class=\"col months-col\" ng-show=\"showMonth\">\n" +
    "      <div class=\"text\">M</div>\n" +
    "      <div><a class=\"button\" ng-click=\"incrementMonths()\"><i ng-class=\"incIconClass\"></i></a></div>\n" +
    "      <div class=\"months-val\">{{ widget.months }}</div>\n" +
    "      <div><a class=\"button\" ng-click=\"decrementMonths()\"><i ng-class=\"decIconClass\"></i></a></div>\n" +
    "    </div>\n" +
    "    <div class=\"col days-col\" ng-show=\"showDay\">\n" +
    "      <div class=\"text\">D</div>\n" +
    "      <div><a class=\"button\" ng-click=\"incrementDays()\"><i ng-class=\"incIconClass\"></i></a></div>\n" +
    "      <div class=\"days-val\">{{ widget.days }}</div>\n" +
    "      <div><a class=\"button\" ng-click=\"decrementDays()\"><i ng-class=\"decIconClass\"></i></a></div>\n" +
    "    </div>\n" +
    "    <div class=\"col hours-col\" ng-show=\"showHour\">\n" +
    "      <div class=\"text\">H</div>\n" +
    "      <div><a class=\"button\" ng-click=\"incrementHours()\"><i ng-class=\"incIconClass\"></i></a></div>\n" +
    "      <div class=\"hours-val\">{{ widget.hours }}</div>\n" +
    "      <div><a class=\"button\" ng-click=\"decrementHours()\"><i ng-class=\"decIconClass\"></i></a></div>\n" +
    "    </div>\n" +
    "    <div class=\"col minutes-col\" ng-show=\"showMinute\">\n" +
    "      <div class=\"text\">M</div>\n" +
    "      <div><a class=\"button\" ng-click=\"incrementMinutes()\"><i ng-class=\"incIconClass\"></i></a></div>\n" +
    "      <div class=\"minutes-val\">{{ widget.minutes }}</div>\n" +
    "      <div><a class=\"button\" ng-click=\"decrementMinutes()\"><i ng-class=\"decIconClass\"></i></a></div>\n" +
    "    </div>\n" +
    "    <div class=\"col seconds-col\" ng-show=\"showSecond\">\n" +
    "      <div class=\"text\">S</div>\n" +
    "      <div><a class=\"button\" ng-click=\"incrementSeconds()\"><i ng-class=\"incIconClass\"></i></a></div>\n" +
    "      <div class=\"seconds-val\">{{ widget.seconds }}</div>\n" +
    "      <div><a class=\"button\" ng-click=\"decrementSeconds()\"><i ng-class=\"decIconClass\"></i></a></div>\n" +
    "    </div>\n" +
    "    <div class=\"col meridian-col\" ng-show=\"showMeridian\">\n" +
    "      <div class=\"text\">A</div>\n" +
    "      <div><a class=\"button\" ng-click=\"toggleMeridian()\"><i ng-class=\"incIconClass\"></i></a></div>\n" +
    "      <div class=\"meridian-val\" ng-click=\"toggleMeridian()\">{{ widget.meridian }}</div>\n" +
    "      <div><a class=\"button\" ng-click=\"toggleMeridian()\"><i ng-class=\"decIconClass\"></i></a></div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );

}]);

