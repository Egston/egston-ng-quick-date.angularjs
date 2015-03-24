angular.module('ngQuickDateEgstonDefaults', ['ngQuickDate'])

.config(function(ngQuickDateDefaultsProvider) {
    var getEasterMonday = function(Y) {
        var C = Math.floor(Y/100);
        var N = Y - 19*Math.floor(Y/19);
        var K = Math.floor((C - 17)/25);
        var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;
        I = I - 30*Math.floor((I/30));
        I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));
        var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);
        J = J - 7*Math.floor(J/7);
        var L = I - J;
        var M = 3 + Math.floor((L + 40)/44);
        var D = L + 28 - 31*Math.floor(M/4);
        var m = new Date();
        m.setFullYear(Y);
        m.setMonth(M - 1, D + 1);
    return m;
    };

    return ngQuickDateDefaultsProvider.set({
        stdWeek: true,
        timezone: 'UTC',
        dayAbbreviations: ["M", "Tu", "W", "Th", "F", "Sa", "Su"],
        disableTimepicker: true,
        dateFilter: function(d) {
            if (!d) {
                return true;
            }
            var wday = d.getDay();
            var day = d.getDate();
            var month = d.getMonth();
            var easter = getEasterMonday(d.getFullYear());
            var is_holiday = (
                    // Public holidays in Czech Republic
                    wday === 0 || wday === 6
                    || (day === 1 && month === 0)
                    || (day === 1 && month === 4)
                    || (day === 8 && month === 4)
                    || (day === 5 && month === 6)
                    || (day === 6 && month === 6)
                    || (day === 28 && month === 8)
                    || (day === 28 && month === 9)
                    || (day === 17 && month === 10)
                    || (day === 24 && month === 11)
                    || (day === 25 && month === 11)
                    || (day === 26 && month === 11)
                    // Eastern Monday
                    || (day === easter.getDate()
                        && month === easter.getMonth())
                );
            return !is_holiday;
        }
    });
});
