(() => {
 'use strict';
 const names=['Иванов Алексей Николаевич','Петрова Мария Сергеевна','Сидоров Дмитрий Игоревич','Кузнецова Ольга Владимировна','Морозов Алексей Евгеньевич','Васильева Татьяна Петровна','Новиков Сергей Андреевич','Федорова Наталья Константиновна','Смирнов Михаил Викторович','Зайцева Елена Юрьевна','Григорьев Павел Дмитриевич','Андреева Светлана Васильевна','Воробьев Николай Сергеевич','Киселева Инна Александровна','Тарасов Виктор Иванович','Макарова Евгения Николаевна'];
 const cities=['Москва','Казань','Санкт-Петербург','Екатеринбург'],statuses=['Активен','Новый','На проверке'];
 const dates=['08.10.2026','01.09.2026','15.08.2026','03.10.2026','21.09.2026','12.07.2026','30.09.2026','04.10.2026','19.08.2026','07.10.2026','01.10.2026','25.09.2026','14.09.2026','09.10.2026','28.08.2026','06.10.2026'];
 const amounts=[12500,85000,1200,34000,150000,9700,24500,65000,800,48000,12000,240000,3600,73500,18200,56000];
 const rows=names.map((name,i)=>({id:i+1,name,city:cities[i%cities.length],status:statuses[i%statuses.length],date:dates[i],amount:amounts[i]}));
 const money=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
 window.uiKitDemoTable=new UIKitTables.DataTable(document.getElementById('table-demo-mount'),{label:'Клиенты — демонстрационные данные',rows,columns:[
  {key:'name',label:'ФИО',width:300,filter:'text'},
  {key:'city',label:'Город',width:200,filter:'select'},
  {key:'status',label:'Статус',width:170,filter:'select'},
  {key:'date',label:'Дата обращения',width:180,filter:'date'},
  {key:'amount',label:'Сумма, ₽',width:150,filter:'number',format:value=>money.format(value)}
 ]});
})();
