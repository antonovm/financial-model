# Быстрый анализ финансовой-модели

Назначение этой таблицы - замена Excel для быстрого анализа финансовой модели. Часто возникают ситуации, когда необходимо произвести грубый расчет вновь возникшей идеи, оценить ее ключевые значения, проанализировать влияние основных факторов.

### Почему отдельное решение (а не Excel)?

* Сложность работы с повторными (retention) периодами в Excel. Изменение периодов влечет к сдвигу колонок, что сложно сделать нативными средствами Excel (и он теряет свое удобство и наглядность)
* Удобство адаптации. Код основан на [HandsOnTable](http://www.handsontable.com), изменять и адаптировать строки и формулы удобно и быстро. 
* Удобство хранения и шаринга различных вариантов моделей. Параметры кодируются в URL в виде GET запросов - можно не хранить несколько версий Excel файлов, а сохранять и отправлять URL нужной модели в мессенджере
* Построение графиков зависимости прибыли от параметров модели. 

Пример модели: [http://financial-model.netlify.com/](http://financial-model.netlify.com/index.html?model-name=Пример+модели&installment-investment=100000&traffic-first-week=100&traffic-last-week=200&cpc=30&c1-register=15&c2-sale=50&retention-period=4&crr=70&sale-price=500&op-expenses=20000&num-of-weeks=52&currency=RUR)
 
- - -

### Внесение изменений

Модель изначально создавалась под конкретную задачу, для решения других задач и получения других метрик могут потребоваться изменения. Это делается максимально просто.

Работа производится с двумя файлами:

* /index.html - отображение
* /dist/model-calculation.js - логика расчета

#### Добавление новых параметров

Параметры задаются в файле index.html путем добавления полей ввода. С учетом используемого CSS-фреймворка (Pure) задается следующая конструкция:

	<div class="pure-control-group">
    	<label for="traffic-last-week">Трафик в последнюю неделю</label>
        <input name="traffic-last-week" id="traffic-last-week" type="text" value="">
	</div>

Параметры передаются в функцию get_data_table() в массив params, доступ к нужному значению: params["traffic-last-week"]

#### Изменения в расчете

Расчет происходит в функции get_data_table() в файле model-calculation.js
Происходит проход по столбцам, расчет строки происходит следующим образом:

        // Инкрементация номера строки
        rowNum++;
        
        // Референс создаваемой строки: clients-new
        setRow(rowNum, "Новых продаж", "clients-new");
        
        // Ссылка на предыдущую строку текущего столбца, если необходимо: table[rowNames["register-new"]][i]
        table[rowNum][i] = table[rowNames["register-new"]][i] * params["c2-sale"] / 100;
        
        // Формат ячейки: formatNumber или formatCurrency
        cellFormat[rowNum][i] = formatNumber;


Блоки со строками можно удалять или перемещать, необходимо отследить зависимости других строк от них.

При необходимости можно вставить пустую строку:

	addEmptyRow();

### License

The MIT License (see the [LICENSE](https://github.com/handsontable/handsontable/blob/master/LICENSE) file for the full text)

### Contact

You can contact us at hello@handsontable.com.# financial-model
