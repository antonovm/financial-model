

function queryParameters () {
    var result = {};

    var params = window.location.search.split(/\?|\&/);

    params.forEach( function(it) {
        if (it) {
            var param = it.split("=");
            result[param[0]] = decodeURIComponent((param[1]+'').replace(/\+/g, '%20'));
        }
    });

    return result;
}

function get_url_parameters() {
    var params = {};
    var getparams = queryParameters ();

    $.each(getparams, function(key, value) {
        params[key] = value;
        $("#"+key).val(value);
    });

    return params;
}


function get_form_parameters() {

     var params = {};
     $( "#parameters-form input" ).each(function() {
     params[$(this).attr("id")] =  $(this).val();
     });

     $( "#parameters-form select" ).each(function() {
     params[$(this).attr("id")] =  $(this).val();
     });

    return params;
}


function get_data_table(params) {

    function setRow (_rowNum, _rowName, _rowCode) {
        if (i == 0) {
            data["rowHeaders"][rowNum] = _rowName;
            table[rowNum] = [];
            cellFormat[rowNum] = [];
            if (_rowCode) rowNames[_rowCode] = _rowNum;
        }
    }

    function addEmptyRow () {
        rowNum++;
        setRow(rowNum, "");
    }

    // Форматы ячеек
    var formatNumber = '0.00';
    var formatCurrency = '$0,0.00';
    var formatLanguage = 'en';
    switch(params["currency"]) {
        case 'RUR':
            formatCurrency = '0,0 $';
            formatLanguage = 'ru';
            break;
        case 'USD':
            formatLanguage = 'en';
            break;
        case 'EUR':
            formatLanguage = 'de';
            break;
        case 'GBP':
            formatLanguage = 'en-gb';
            break;
    }

    // Макс. количество "волн" повторных клиентов в течение рассчитываемого периода
    var maxRetentionTimes = Math.ceil (params["num-of-weeks"] / params["retention-period"]);

    // Инициализация массивов
    var data = {};
    data["colHeaders"] = [];
    data["rowHeaders"] = [];
    data["table"] = [];
    data["cellFormat"] = [];
    var table = [];
    var cellFormat = [];
    var rowNames = {};
    var investmentsRequired = null;
    var maxWalletAmount = null;

    for (var i=0; i < params["num-of-weeks"]; i++) {
        data["colHeaders"][i] = "Неделя " + (i+1);
        var rowNum = 0;

        var curTraffic = ((params["traffic-first-week"]-params["traffic-last-week"])*i + (0 - params["num-of-weeks"]*params["traffic-first-week"])) / (0-params["num-of-weeks"]);

        // Новый трафик
        setRow(rowNum, "Новый трафик", "traffic-new");
        table[rowNum][i] = curTraffic;
        cellFormat[rowNum][i] = formatNumber;

        // Новых регистраций
        rowNum++;
        setRow(rowNum, "Новых регистраций", "register-new");
        table[rowNum][i] = table[rowNames["traffic-new"]][i] * params["c1-register"] / 100;
        cellFormat[rowNum][i] = formatNumber;

        // Новых клиентов
        rowNum++;
        setRow(rowNum, "Новых продаж", "clients-new");
        table[rowNum][i] = table[rowNames["register-new"]][i] * params["c2-sale"] / 100;
        cellFormat[rowNum][i] = formatNumber;

        addEmptyRow();

        // Повторные клиенты
        var totalColRetention = 0;
        var retentionWeekStart = 0; // С какой недели начинается эта волна возвратов
        for (var k=1; k < maxRetentionTimes; k++) {
            rowNum++;
            setRow(rowNum, "Повторные продажи "+k, "retention-clients-"+k);
            retentionWeekStart = params["retention-period"] * k - 1;
            if (i >= retentionWeekStart ) {
                var retentionRow = (k == 1) ? rowNames["clients-new"] : (rowNum - 1); //  C какой строки берем расчет (c новых или пред. волны)
                table[rowNum][i] = table[retentionRow][(i - params["retention-period"] + 1)] * params["crr"] / 100;
                totalColRetention = totalColRetention + table[rowNum][i];
                cellFormat[rowNum][i] = formatNumber;
            } else {
                table[rowNum][i] = '-';
            }
        }
        rowNum++;
        setRow(rowNum, "Всего повторных", "retention-clients-total");
        if (totalColRetention > 0) {
            table[rowNum][i] = totalColRetention;
            cellFormat[rowNum][i] = formatNumber;
        } else {
            table[rowNum][i] = '-';
        }

        addEmptyRow();

        // Всего продаж
        rowNum++;
        setRow(rowNum, "Всего продаж", "sales-total");
        table[rowNum][i] = table[rowNames["clients-new"]][i] + ((totalColRetention > 0) ? table[rowNames["retention-clients-total"]][i] : 0);
        cellFormat[rowNum][i] = formatNumber;

        // Валовый доход
        rowNum++;
        setRow(rowNum, "Валовый доход", "gross-income");
        table[rowNum][i] = table[rowNames["sales-total"]][i] * params["sale-price"];
        cellFormat[rowNum][i] = formatCurrency;

        // Валовый доход / новые клиенты
        rowNum++;
        setRow(rowNum, "Валовый доход / новые клиенты", "gross-to-new-clients");
        table[rowNum][i] = table[rowNames["gross-income"]][i] / table[rowNames["clients-new"]][i];
        cellFormat[rowNum][i] = formatCurrency;

        addEmptyRow();

        // Стоимость привлечения клиента
        rowNum++;
        setRow(rowNum, "Общая стоимость привлечения новых клиентов", "total-cac");
        table[rowNum][i] = table[rowNames["traffic-new"]][i] * params["cpc"];
        cellFormat[rowNum][i] = formatCurrency;

        // Операционные расходы
        rowNum++;
        setRow(rowNum, "Операционные расходы", "op-expenses");
        table[rowNum][i] = params["op-expenses"] / 4.5;
        cellFormat[rowNum][i] = formatCurrency;

        // Всего потрачено
        rowNum++;
        setRow(rowNum, "Всего потрачено", "spent-total");
        table[rowNum][i] = table[rowNames["total-cac"]][i] + table[rowNames["op-expenses"]][i];
        cellFormat[rowNum][i] = formatCurrency;

        addEmptyRow();

        // Стоимость продажи
        rowNum++;
        setRow(rowNum, "CAC - стоимость привлечения 1 нового клиента", "client-cac");
        table[rowNum][i] = table[rowNames["total-cac"]][i] / table[rowNames["clients-new"]][i];
        cellFormat[rowNum][i] = formatCurrency;

        // Стоимость продажи
        rowNum++;
        setRow(rowNum, "COGS - оп. затраты на 1 продажу", "client-cogs");
        table[rowNum][i] = table[rowNames["op-expenses"]][i] * params["cpc"] / table[rowNames["sales-total"]][i];
        cellFormat[rowNum][i] = formatCurrency;

        // Всего потрачено / новые клиенты
        rowNum++;
        setRow(rowNum, "Всего потрачено / новые клиенты", "op-cac-per-client");
        table[rowNum][i] = table[rowNames["spent-total"]][i] / table[rowNames["clients-new"]][i];
        cellFormat[rowNum][i] = formatCurrency;


        addEmptyRow();

        // Получено - Потрачено
        rowNum++;
        setRow(rowNum, "Получено - Потрачено", "income-spent");
        table[rowNum][i] = table[rowNames["gross-income"]][i] - table[rowNames["spent-total"]][i];
        cellFormat[rowNum][i] = formatCurrency;

        // Кошелек (net flow)
        rowNum++;
        setRow(rowNum, "Кошелек (net flow)", "net-flow");
        var netflow = (i > 0 ? table[rowNames["net-flow"]][i - 1] : 0) + table[rowNames["income-spent"]][i];
        if (investmentsRequired == null || netflow < investmentsRequired) investmentsRequired = netflow;
        if (maxWalletAmount == null || netflow > maxWalletAmount) maxWalletAmount = netflow;
        table[rowNum][i] = netflow;
        cellFormat[rowNum][i] = formatCurrency;

        addEmptyRow();
    }

    // Расчет процентов (годовых)
    // По формуле I = S * 100 * K / (P*t)
    // I – годовая процентная ставка
    // t – количество недель начисления процентов по привлеченному вкладу
    // K – количество недель в календарном году (53)
    // P – первоначальная сумма привлеченных в депозит денежных средств
    // S – сумма начисленных процентов (в денежном выражении).

    var annualInterestRate = maxWalletAmount*53/((investmentsRequired * (-1)) * params["num-of-weeks"]);

    data["table"] = table;
    data["cellFormat"] = cellFormat;
    data["formatLanguage"] = formatLanguage;
    data["formatCurrency"] = formatCurrency;
    data["investmentsRequired"] = investmentsRequired;
    data["maxWalletAmount"] = maxWalletAmount;
    data["annualInterestRate"] = annualInterestRate;

    return data
}

function drawGraph() {
    var data = new google.visualization.DataTable();
    data.addColumn('number', 'X');
    data.addColumn('number', 'Кошелек');
    data.addColumn('number', '% годовых');

    var params = get_form_parameters();
    var table = [];
    var vParamName = $("#vAxisSelect").val();
    var vParamTextName = $("label[for='"+vParamName+"']").html();
    var from = parseInt($("#graph-from").val());
    var to = parseInt($("#graph-to").val());
    var step = ((to - from)/15);

    var i=0;
    var d=from;
    var hValue = 0;

    // Для расчета угла
    //var minX = 0;
    //var minY = 0;
    //var maxX = 0;
    //var maxY = 0;

    while (d <= to) {
        params[vParamName] = d;

        // Получаем крайне правое значение - значение кошелька в последнюю неделю
        var calcData = get_data_table(params);

        table[i] = [];
        table[i][0] = d;
        table[i][1] = calcData["maxWalletAmount"];
        table[i][2] = calcData["annualInterestRate"]*100;

        // Расчет координаты 1й вершины треугольника
        //if (d == from) {
        //    minY = hValue;
        //    minX = d;
        //}

        d = d + step
        // Итерация у недель только по целым числам
        if (vParamName == 'retention-period') {
            var l = Math.round (d);
            if (l == Math.round (d - step)) d = l + 1;
            else d = l;
        }
        i++;
    }

    // Расчет координаты 2й вершины треугольника
    //maxY = hValue;
    //maxX = d - step;
    // Расчет угла
    //var sideA = Math.abs(maxY - minY);
    //var sideB = Math.abs(maxX - minX);
    //var lineAngle = Math.atan(sideA / sideB)

    data.addRows(table);

    var options = {
        hAxis: {
            title: vParamTextName,
            textStyle: {
                color: '#000000',
                fontSize: 12,
                fontName: 'Arial',
                bold: true,
            },
            titleTextStyle: {
                color: '#000000',
                fontSize: 16,
                fontName: 'Arial',
                bold: false,
            }
        },
        vAxis: {
            0: {
                title: 'Кошелек',
                textStyle: {
                    color: '#1a237e',
                    fontSize: 12,
                    bold: true
                },
                titleTextStyle: {
                    color: '#1a237e',
                    fontSize: 24,
                    bold: true
                }
            },
            1: {
                title: '% годовых',
                textStyle: {
                    color: '#1a237e',
                    fontSize: 12,
                    bold: true
                },
                titleTextStyle: {
                    color: '#1a237e',
                    fontSize: 24,
                    bold: true
                }
            }

        },
        series: {
            0: {targetAxisIndex: 0},
            1: {targetAxisIndex: 1},
        },
        colors: ['#a52714', 'orange']
    };

    window.builtcharts++;
    $("#charts").append("<div id='chart-"+window.builtcharts+"'></div>")

    var chart = new google.visualization.LineChart(document.getElementById('chart-'+window.builtcharts));
    chart.draw(data, options);
}

$( document ).ready(function() {

    var params = get_url_parameters();

    // Расчет таблицы
    if (Object.keys(params).length > 0) {
        var data = get_data_table(params);
        container = document.getElementById('mfotable');

        hot = new Handsontable(container, {
            data: data["table"],
            minSpareRows: 1,
            colHeaders: true,
            rowHeaders: true,
            contextMenu: false,
            currentRowClassName: 'currentRow',
            currentColClassName: 'currentCol',
            autoWrapRow: true,
            colWidths: 125,
            colHeaders: data["colHeaders"],
            rowHeaders: data["rowHeaders"],
            cells: function (row, col, prop) {
                if (data["cellFormat"][row] && data["cellFormat"][row][col]) {
                    return  {
                        type: 'numeric',
                        language: data["formatLanguage"],
                        format: data["cellFormat"][row][col],
                        className: (data["table"][row][col] < 0) ? 'negative-value' : ''
                    };
                }
            }
        });

        // Статистика по таблице
        $("#investmenst-amount").html('Нижнее значение кошелька: ' + numeral(data["investmentsRequired"]).format(data["formatCurrency"]) + '<br> Ставка прибыли на конец срока, годовых: ' + numeral(data["annualInterestRate"]).format('0.00%'));
    }

    //  Заполнить дропдаун выбора для графика
    $( "#parameters-form input:not(.no-graph)" ).each(function() {
        $('#vAxisSelect').append( $('<option></option>').val($(this).attr("id")).html($("label[for='"+$(this).attr("id")+"']").html()) )
    });


    window.builtcharts = 0;
    $( "#build-graph" ).click(function() {
        drawGraph();
        return false;
    });



});
