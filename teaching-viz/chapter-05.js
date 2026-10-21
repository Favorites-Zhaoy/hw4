import { el,svg,table,selectControl,button,format } from './utils.js';
import { createSpiralGeometry,localKey,localDays,calendarCell,loadWeather,loadNames,yearWindow,STORY_DATA } from './models-05.js';

const step=(id,label,codeTargets,explain)=>({id,label,codeTargets,explain});
const range=(block,from,to=from)=>({block,from,to});
export function chapter05(d3){return[attributesDefinition(d3),namesDefinition(d3),calendarDefinition(d3),spiralDefinition(d3),storyDefinition(d3)];}

function attributesDefinition(d3){
  const labels=[['有序','Ordered'],['连续','Continuous'],['周期','Periodic'],['独立于空间','Spatially independent'],['结构','Structured']], ids=['ordered','continuous','periodic','space','structured'];
  return{sectionId:'5.1',title:['时间五属性，各看一张小图','Five time properties, five small diagrams'],goal:['区分时间次序、细分、重复相位、空间和日历层级。','Distinguish order, subdivision, repeated phase, space and calendar structure.'],source:['教学微案例；本地 Date / d3.timeDay.range。先后关系不证明因果。','Teaching microcases; local Date / d3.timeDay.range. Order alone does not prove causality.'],steps:ids.map((id,i)=>step(id,labels[i],[range(0,3+i*3,5+i*3),...(i===4?[range(1,2,4)]:[])],[[ '同样三件事，按时间重排。','两个时刻之间还能插入时刻。','相隔24小时可以具有同一相位。','时间相同，不必具有相同空间坐标。','本地月份从0开始，结束日期不包含在range内。'][i],[ 'Reorder the same three events by time.','Insert a moment between two moments.','Times 24 hours apart can share a phase.','Equal times need not share spatial coordinates.','Local months start at 0; range excludes its end.'][i]])),
    create(ctx){
      const {root,t,selectStep}=ctx;let current='ordered',ordered=true,insert=false,phase=6,spatial=false,year=2024;
      root.replaceChildren();const cards=el('div'),detail=el('div',{className:'tv-card'});cards.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px';root.append(cards,detail);
      const pictures=ids.map((id,i)=>{const card=el('button',{type:'button'},t(...labels[i])),pic=svg('svg',{viewBox:'0 0 120 55'});card.append(pic);card.onclick=()=>selectStep(id);cards.append(card);return{card,pic};});
      const line=(pic,x1,y1,x2,y2)=>pic.append(svg('line',{x1,y1,x2,y2,stroke:'#617e36'}));
      const dot=(pic,x,y,text)=>{pic.append(svg('circle',{cx:x,cy:y,r:4,fill:'#123e37'}),svg('text',{x,y:y+18,'text-anchor':'middle',style:'font-size:10px'},text));};
      function draw(){
        pictures.forEach(({card,pic},i)=>{card.setAttribute('aria-pressed',String(ids[i]===current));pic.replaceChildren();
          if(i===0){line(pic,10,20,110,20);(ordered?[8,9,10]:[10,8,9]).forEach((v,j)=>dot(pic,20+j*40,20,`${v}:00`));}
          if(i===1){line(pic,10,20,110,20);[0,...(insert?[0.5]:[]),1].forEach(v=>dot(pic,10+v*100,20,v));}
          if(i===2){pic.append(svg('circle',{cx:60,cy:25,r:20,fill:'none',stroke:'#617e36'}));const a=phase/24*Math.PI*2;dot(pic,60+20*Math.sin(a),25-20*Math.cos(a),`${phase}h`);}
          if(i===3){line(pic,10,20,110,20);dot(pic,60,20,spatial?'09:00 · A/B':'09:00');}
          if(i===4){pic.append(svg('text',{x:5,y:20,style:'font-size:11px'},`${year} → 02 → ${year===2024?'29':'28'}`),svg('text',{x:5,y:42,style:'font-size:11px'},t('年 → 月 → 日','Year → month → day')));}
        });
        detail.replaceChildren();const index=ids.indexOf(current);detail.append(el('strong',{},t(...labels[index])));
        const act=(label,fn)=>{const b=el('button',{type:'button'},label);b.onclick=()=>{fn();draw();};detail.append(b);};
        if(index===0)act(t(ordered?'打乱显示':'按时间排序',ordered?'Shuffle display':'Sort by time'),()=>ordered=!ordered);
        if(index===1)act(t('插入0.5时刻','Insert moment 0.5'),()=>insert=true);
        if(index===2){act(t('换一个相位','Change phase'),()=>phase=(phase+6)%24);detail.append(el('p',{},`${phase}h ≡ ${phase+24}h ${t('（24小时相位）','(24-hour phase)')}`));}
        if(index===3)act(t('切换时间 / 时间+空间','Toggle time / time + space'),()=>spatial=!spatial);
        if(index===4){act(t('切换2023 / 2024','Toggle 2023 / 2024'),()=>year=year===2024?2023:2024);const days=d3.timeDay.range(new Date(year,0,1),new Date(year+1,0,1));detail.append(el('p',{className:'tv-result'},`${days.length} ${t('天','days')} · ${localKey(days[0])} → ${localKey(days.at(-1))}\n${t('不包含','Excludes')} ${year+1}-01-01`));}
      }
      draw();return{focus(id){current=id;draw();},reset(){current='ordered';ordered=true;insert=false;phase=6;spatial=false;year=2024;draw();},destroy(){root.replaceChildren();}};
    }
  };
}

function namesDefinition(d3){
  return{sectionId:'5.2',title:['同一年，读三条曲线','Read three series at one year'],goal:['用同一时间窗与追踪线核对原数据值、时间坐标和曲线。','Verify source values, time coordinates and curves in one shared time window.'],source:['原 french_names.json；来源待教师核对，不作人口学推断。','Original french_names.json; provenance awaits review, without demographic inference.'],steps:[
    step('parse',['① 年份解析','① Parse year'],[range(0,2,4)],['原年份经 timeParse 变为本地 Date。','Source years become local Dates via timeParse.']),
    step('scale',['② 时间映射','② Time scale'],[range(1,2,4)],['三条线共用 domain/range；下表显示同一年真正的 SVG 坐标。','All three lines share domain/range; the table reports actual SVG coordinates.']),
    step('track',['③ 时间追踪','③ Track year'],[range(2,16,22)],['鼠标或年份滑块选择同一年；三项频率来自同一份 JSON。','Pointer or year slider selects one year; all three frequencies come from the same JSON.']),
    step('window',['④ 时间窗口','④ Time window'],[range(1,3)],['教学补充：窗口同时过滤所有序列并更新时间轴，频率原值不变。','Teaching addition: filter every series and update the axis together; frequency values remain unchanged.'])],
    async create(ctx){
      const {root,t,signal,selectStep}=ctx,data=await loadNames();if(signal.aborted)throw new DOMException('Aborted','AbortError');
      const names=['Marie','Jean','Camille'],colors=['#db2777','#2563eb','#059669'],parse=d3.timeParse('%Y');let year=1965,start=1900,end=2020,chosen='all',current='parse';
      root.replaceChildren();const controls=el('div',{className:'tv-controls'});root.append(controls);
      selectControl(controls,t('时间窗','Time window'),[['all','1900–2020'],['middle','1950–2000']],'all',v=>{[start,end]=v==='all'?[1900,2020]:[1950,2000];year=Math.max(start,Math.min(end,year));slider.min=start;slider.max=end;slider.value=year;selectStep('window');},signal);
      selectControl(controls,t('突出序列','Highlight series'),[['all',t('三条','All three')],...names],chosen,v=>{chosen=v;draw();},signal);
      const field=el('label',{className:'tv-field'},t('年份','Year')),slider=el('input',{type:'range',min:1900,max:2020,value:year}),out=el('output');field.append(slider,out);root.append(field);slider.addEventListener('input',()=>{year=+slider.value;selectStep('track');},{signal});
      const chart=svg('svg',{viewBox:'0 0 460 290',role:'img','aria-label':t('三个人名原始频率','Original frequency of three names')}),result=el('div');root.append(chart,result);
      const x=d3.scaleTime().range([50,440]),y=d3.scaleLinear().domain([0,d3.max(names.flatMap(n=>data.names[n]),d=>d.count)*1.1]).range([240,20]),line=d3.line().x(d=>x(parse(String(d.year)))).y(d=>y(d.count)).curve(d3.curveMonotoneX);
      const xAxis=d3.select(chart).append('g').attr('transform','translate(0,240)'),yAxis=d3.select(chart).append('g').attr('transform','translate(50,0)');yAxis.call(d3.axisLeft(y).ticks(4));
      const paths=names.map((name,i)=>d3.select(chart).append('path').attr('fill','none').attr('stroke',colors[i]).attr('stroke-width',2));
      const cross=d3.select(chart).append('line').attr('y1',20).attr('y2',240).attr('stroke','#123e37').attr('stroke-dasharray','3 2'),dots=d3.select(chart).append('g');
      const dated=data.names.Marie.map(d=>({year:parse(String(d.year))})),bisect=d3.bisector(d=>d.year).center;
      d3.select(chart).append('rect').attr('x',50).attr('y',20).attr('width',390).attr('height',220).attr('fill','transparent').on('pointermove',event=>{const position=d3.pointer(event,chart)[0],nearest=dated[bisect(dated,x.invert(position))];year=Math.max(start,Math.min(end,nearest.year.getFullYear()));slider.value=year;selectStep('track');});
      function draw(){
        x.domain([new Date(start,0,1),new Date(end,0,1)]);xAxis.call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%Y')));out.textContent=year;
        const points=names.map((name,i)=>{const filtered=yearWindow(data.names[name],start,end);paths[i].datum(filtered).attr('d',line).attr('opacity',chosen==='all'||chosen===name?1:0.2);const value=data.names[name].find(d=>d.year===year);return{name,value:value?.count,x:x(parse(String(year))),y:value?y(value.count):null,color:colors[i],count:filtered.length};});
        cross.attr('x1',x(parse(String(year)))).attr('x2',x(parse(String(year)))).attr('stroke-width',current==='scale'?3:1);
        dots.selectAll('circle').data(points.filter(d=>d.y!==null),d=>d.name).join('circle').attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',4).attr('fill',d=>d.color);
        result.replaceChildren(el('p',{className:'tv-result'},`${year} → ${parse(String(year)).toString()}\n${start}–${end} · ${t('每条','Each series')} ${points[0].count} ${t('点','points')}`),table([t('序列','Series'),t('原频率','Source frequency'),'SVG x / y'],points.map(d=>[d.name,d.value??t('无数据','No data'),`${format(d.x)} / ${d.y===null?'—':format(d.y)}`])));
      }
      draw();return{focus(id){current=id;draw();},reset(){year=1965;start=1900;end=2020;chosen='all';slider.min=1900;slider.max=2020;slider.value=year;controls.querySelectorAll('select')[0].value='all';controls.querySelectorAll('select')[1].value='all';draw();},destroy(){d3.select(chart).selectAll('*').interrupt();root.replaceChildren();}};
    }
  };
}

function calendarDefinition(d3){
  return{sectionId:'5.3',title:['日期怎样落进日历格？','How a date becomes a calendar cell'],goal:['跟踪同一天的星期、周列、像素和真实温度色值。','Trace one date through weekday, week column, pixels and actual temperature color.'],source:['原 weather_2024.csv，数据来源待教师核对。缺失不作0°C；新图补齐周偏移，原简化公式保留对照。','Original weather_2024.csv; provenance awaits review. Missing is not 0°C; this view includes the week offset and compares the original simplified formula.'],steps:[
    step('days',['① 全年日期','① Year range'],[range(0,2,4)],['本地日期范围含2024-12-31，不含2025-01-01。','The local date range includes 2024-12-31 and excludes 2025-01-01.']),
    step('weekday',['② 星期行','② Weekday row'],[range(1,6,7)],['周日=0；选择周一起点时重新计算行列。','Sunday=0; Monday-first recomputes both rows and columns.']),
    step('week',['③ 周列','③ Week column'],[range(1,1,5)],['新图按真正周边界计算，表中同时列出原 floor(dayIndex/7) 以便教师核对。','This view uses actual week boundaries and also reports the original floor(dayIndex/7) for review.']),
    step('cell',['④ 格子位置','④ Cell position'],[range(1,16,17)],['x=周列×格宽，y=星期行×格高；同一日期只对应一个格子。','x=week column×cell width, y=weekday row×cell height; one cell per date.']),
    step('color',['⑤ 温度色值','⑤ Temperature color'],[range(1,19),range(0,7)],['原温度输入同一色标；无记录显示灰色并标无数据，不套用讲义??0。','Source temperature enters the same color scale; missing values are gray and labeled, without the lecture’s ??0 fallback.']),
    step('month',['⑥ 月界','⑥ Month boundaries'],[range(2,2,5)],['比较七天前的年月，只强调真正跨月的格边。','Compare the year/month seven days earlier to emphasize actual month boundaries.'])],
    async create(ctx){
      const {root,t,signal,selectStep}=ctx,raw=await loadWeather(d3);if(signal.aborted)throw new DOMException('Aborted','AbortError');
      const byKey=new Map(raw.map(d=>[d.date,Number.isFinite(d.temp_max)?d.temp_max:null])),days=d3.timeDay.range(new Date(2024,0,1),new Date(2025,0,1));
      let selected=days[59],weekStart=0,whole=false,palette='RdYlBu',current='days';
      root.replaceChildren();const controls=el('div',{className:'tv-controls'});root.append(controls);
      const date=el('input',{type:'date',min:'2024-01-01',max:'2024-12-31',value:localKey(selected),'aria-label':t('追踪日期','Trace date')});controls.append(date);
      date.addEventListener('change',()=>{selected=days.find(d=>localKey(d)===date.value)??selected;selectStep('cell');},{signal});
      selectControl(controls,t('周起点','Week starts'),[['0',t('周日','Sunday')],['1',t('周一','Monday')]],0,v=>{weekStart=+v;selectStep('week');},signal);
      selectControl(controls,t('范围','Range'),[['micro',t('四周微日历','Four weeks')],['year',t('查看整年','Whole year')]],'micro',v=>{whole=v==='year';draw();},signal);
      selectControl(controls,'colormap',['RdYlBu','Viridis','Cividis'],palette,v=>{palette=v;selectStep('color');},signal);
      const chart=svg('svg',{role:'img','aria-label':t('2024年日历格追踪','Trace 2024 calendar cells')}),result=el('div');root.append(chart,result);
      function draw(){
        const cell=24,chosen=calendarCell(selected,weekStart,cell),firstColumn=whole?0:Math.floor(chosen.column/4)*4,visible=days.filter(d=>{const c=calendarCell(d,weekStart,cell).column;return whole||(c>=firstColumn&&c<firstColumn+4);});
        const columns=whole?54:4,color=d3.scaleSequential(d3[`interpolate${palette}`]).domain([30,-5]);chart.setAttribute('viewBox',`0 0 ${columns*cell+35} 210`);
        const rects=d3.select(chart).selectAll('rect.cell').data(visible,localKey).join('rect').attr('class','cell').attr('x',d=>30+(calendarCell(d,weekStart,cell).column-firstColumn)*cell).attr('y',d=>20+calendarCell(d,weekStart,cell).row*cell).attr('width',cell).attr('height',cell).attr('fill',d=>{const v=byKey.get(localKey(d));return v==null?'#d4d6cf':color(v);}).attr('stroke',d=>localKey(d)===localKey(selected)?'#123e37':'#fff').attr('stroke-width',d=>localKey(d)===localKey(selected)?3:1).attr('tabindex',0).attr('role','button').attr('aria-label',d=>`${localKey(d)}: ${byKey.get(localKey(d))??t('无数据','No data')}`).on('click',(_,d)=>{selected=d;date.value=localKey(d);selectStep('cell');}).on('keydown',(e,d)=>{if(['Enter',' '].includes(e.key)){e.preventDefault();selected=d;date.value=localKey(d);selectStep('cell');}});
        const weekdays=weekStart?['Mon','Tue','Wed','Thu','Fri','Sat','Sun']:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        d3.select(chart).selectAll('text.day').data(weekdays).join('text').attr('class','day').attr('x',2).attr('y',(_,i)=>37+i*cell).style('font-size','10px').text(d=>d);
        const boundary=current==='month'?visible.filter(d=>{const before=d3.timeDay.offset(d,-7);return before.getMonth()!==d.getMonth()||before.getFullYear()!==d.getFullYear();}):[];
        d3.select(chart).selectAll('line.month').data(boundary,localKey).join('line').attr('class','month').attr('x1',d=>30+(calendarCell(d,weekStart,cell).column-firstColumn)*cell).attr('x2',d=>30+(calendarCell(d,weekStart,cell).column-firstColumn)*cell).attr('y1',d=>20+calendarCell(d,weekStart,cell).row*cell).attr('y2',d=>20+(calendarCell(d,weekStart,cell).row+1)*cell).attr('stroke','#b5453c').attr('stroke-width',2);
        d3.select(chart).selectAll('line.month-first').data(boundary.filter(d=>d.getDate()===1&&calendarCell(d,weekStart,cell).row!==0),localKey).join('line').attr('class','month-first').attr('x1',d=>30+(calendarCell(d,weekStart,cell).column-firstColumn)*cell).attr('x2',d=>30+(calendarCell(d,weekStart,cell).column-firstColumn+1)*cell).attr('y1',d=>20+calendarCell(d,weekStart,cell).row*cell).attr('y2',d=>20+calendarCell(d,weekStart,cell).row*cell).attr('stroke','#b5453c').attr('stroke-width',2);
        const value=byKey.get(localKey(selected)),valid=days.filter(d=>byKey.get(localKey(d))!=null).length;
        result.replaceChildren(el('p',{className:'tv-result'},`${days.length} ${t('天','days')} · ${t('有效','valid')} ${valid} / ${t('缺失','missing')} ${days.length-valid}\n${localKey(selected)} → ${t('第','day')} ${chosen.day} ${t('天','')} → row ${chosen.row}, week ${chosen.column}\nx=${chosen.x}, y=${chosen.y} ${t('（不含图边距）','(before chart margins)')}\n${value==null?t('无数据','No data'):`${value}°C → ${color(value)}`}\n${t('原简化周列','Original simplified week')}=${Math.floor((chosen.day-1)/7)}`),el('p',{},t('色标输入范围30→−5°C；格子线框为当前日期。','Color domain: 30→−5°C; the outlined cell is the selected date.')));
        const legend=el('div',{'aria-label':'−5°C → 30°C'});legend.style.display='flex';legend.append(el('small',{},'−5°C'));
        for(let i=0;i<12;i++){const swatch=el('span');swatch.style.cssText=`flex:1;min-height:18px;background:${color(-5+i*35/11)}`;legend.append(swatch);}legend.append(el('small',{},'30°C'));result.append(legend);
      }
      draw();return{focus(id){current=id;draw();},reset(){selected=days[59];weekStart=0;whole=false;palette='RdYlBu';date.value=localKey(selected);controls.querySelectorAll('select').forEach((s,i)=>s.value=['0','micro','RdYlBu'][i]);draw();},destroy(){root.replaceChildren();}};
    }
  };
}

function storyDefinition(d3){
  return{sectionId:'5.5',title:['角色线与事件，分别表达什么？','What do character lines and events express?'],goal:['定位原角色控制点、平滑路径和事件时刻，区分布局 y 与时间 x。','Locate original character control points, smooth paths and event times; distinguish layout y from time x.'],source:['原脚本五角色/两事件；剧情结构教学示意，非电影逐秒标注。y仅为聚散布局，非人数/精确物理距离。','Original script: five characters, two events. Teaching story structure, not frame-accurate annotation. y is layout, not population or physical distance.'],steps:[
    step('time',['① 时间坐标','① Time position'],[range(0,2,4)],['人物点与事件都经过同一个时间尺度。','Character points and events use the same time scale.']),
    step('points',['② 角色控制点','② Character points'],[range(0,8,14)],['表格读原始 {time,y}；屏幕 y 另经过原 demo 的 yScale。','Read original {time,y}; screen y also uses the original demo’s yScale.']),
    step('datum',['③ 整条序列','③ Whole series'],[range(0,25,27)],['datum(c.points) 把整个数组绑定到一条 path，而不是一行对应一条线。','datum(c.points) binds the entire array to one path, not one path per row.']),
    step('curve',['④ 曲线与骨架','④ Curve and skeleton'],[range(0,19,22),range(2,5)],['平滑线与虚线骨架使用同一组控制点；改变 alpha 不改原控制点。','Smooth and dashed skeleton paths use the same control points; alpha does not change those points.']),
    step('events',['⑤ 事件层','⑤ Event layer'],[range(1,9,19)],['半透明事件圈的 x 与角色同一时刻对齐；相关角色依据原事件说明标示。','Event-circle x aligns with character times; related roles follow the original event descriptions.'])],
    create(ctx){
      const {root,t,signal,selectStep}=ctx,data=STORY_DATA;let role=0,index=0,eventIndex=0,alpha=0.5,current='time',layer='both';root.replaceChildren();
      const controls=el('div',{className:'tv-controls'});root.append(controls);
      const roleSelect=selectControl(controls,t('角色','Character'),data.characters.map((d,i)=>[String(i),d.name]),0,v=>{role=+v;index=0;refreshPoints();selectStep('datum');},signal);
      const pointSelect=selectControl(controls,t('控制点','Control point'),[],0,v=>{index=+v;selectStep('points');},signal);
      selectControl(controls,t('图层','Layers'),[['both',t('角色+事件','Characters + events')],['roles',t('只看角色','Characters')],['events',t('只看事件','Events')]],layer,v=>{layer=v;draw();},signal);
      const eventSelect=selectControl(controls,t('事件','Event'),data.events.map((d,i)=>[String(i),d.name]),0,v=>{eventIndex=+v;selectStep('events');},signal);
      const label=el('label',{className:'tv-field'},'alpha'),slider=el('input',{type:'range',min:0,max:1,step:0.1,value:0.5});label.append(slider);controls.append(label);slider.addEventListener('input',()=>{alpha=+slider.value;selectStep('curve');},{signal});
      const chart=svg('svg',{viewBox:'0 0 800 460',role:'img','aria-label':t('原侏罗纪公园角色与事件','Original Jurassic Park characters and events')}),result=el('div');root.append(chart,result);
      const x=d3.scaleLinear().domain([0,127]).range([110,770]),y=d3.scaleLinear().domain([0,400]).range([420,30]),line=d3.line().x(d=>x(d.time)).y(d=>y(d.y));
      d3.select(chart).append('g').attr('transform','translate(0,420)').call(d3.axisBottom(x).ticks(6));
      const paths=data.characters.map((c,i)=>d3.select(chart).append('path').datum(c.points).attr('fill','none').attr('stroke',c.color).attr('stroke-width',c.width).attr('tabindex',0).attr('role','button').attr('aria-label',c.name).on('click',()=>{role=i;roleSelect.value=String(i);index=0;refreshPoints();selectStep('datum');}).on('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();role=i;roleSelect.value=String(i);index=0;refreshPoints();selectStep('datum');}}));
      const skeleton=d3.select(chart).append('path').attr('fill','none').attr('stroke','#123e37').attr('stroke-dasharray','4 3'),points=d3.select(chart).append('g'),guide=d3.select(chart).append('line').attr('y1',30).attr('y2',420).attr('stroke','#123e37').attr('stroke-dasharray','3 3');
      const eventLayer=d3.select(chart).append('g'),events=eventLayer.selectAll('circle').data(data.events).join('circle').attr('cx',d=>x(d.time)).attr('cy',d=>y(d.y)).attr('r',18).attr('fill','#d32f2f33').attr('tabindex',0).attr('role','button').attr('aria-label',d=>d.name).on('click',(_,d)=>{eventIndex=data.events.indexOf(d);eventSelect.value=String(eventIndex);selectStep('events');}).on('keydown',(e,d)=>{if(['Enter',' '].includes(e.key)){e.preventDefault();eventIndex=data.events.indexOf(d);eventSelect.value=String(eventIndex);selectStep('events');}});
      function refreshPoints(){pointSelect.replaceChildren(...data.characters[role].points.map((p,i)=>el('option',{value:i},`${p.time} min / y ${p.y}`)));pointSelect.value=String(index);}
      function draw(){
        const c=data.characters[role],p=c.points[index],ev=data.events[eventIndex],related=eventIndex===0?[0,1]:[4];
        paths.forEach((path,i)=>path.attr('d',line.curve(d3.curveCatmullRom.alpha(alpha))).attr('opacity',layer==='events'?0.08:(current==='events'?related.includes(i):i===role)?1:0.3));
        skeleton.datum(c.points).attr('d',line.curve(d3.curveLinear)).attr('opacity',current==='curve'?1:0);
        points.selectAll('circle').data(c.points).join('circle').attr('cx',d=>x(d.time)).attr('cy',d=>y(d.y)).attr('r',d=>d===p?6:3).attr('fill',c.color).attr('opacity',layer==='events'?0:1).attr('tabindex',layer==='events'?-1:0).attr('role','button').attr('aria-label',d=>`${c.name}: ${d.time} min, y ${d.y}`).on('click',(_,d)=>{index=c.points.indexOf(d);pointSelect.value=String(index);selectStep('points');}).on('keydown',(e,d)=>{if(['Enter',' '].includes(e.key)){e.preventDefault();index=c.points.indexOf(d);pointSelect.value=String(index);selectStep('points');}});
        const time=current==='events'?ev.time:p.time;guide.attr('x1',x(time)).attr('x2',x(time));eventLayer.attr('display',layer==='roles'?'none':null);events.attr('stroke',(_,i)=>current==='events'&&i===eventIndex?'#d32f2f':'none').attr('stroke-width',2);
        result.replaceChildren(el('p',{className:'tv-result'},`${c.name} · ${c.points.length} ${t('控制点','control points')} · alpha=${alpha}\n{time:${p.time}, y:${p.y}} → SVG (${format(x(p.time))}, ${format(y(p.y))})\n${current==='events'?`${ev.name}: ${ev.desc}\ntime=${ev.time} → x=${format(x(ev.time))}`:t('y是原剧情布局，不是人数或距离。','y is narrative layout, not population or distance.')}`));
      }
      refreshPoints();draw();return{focus(id){current=id;draw();},reset(){role=0;index=0;eventIndex=0;alpha=0.5;layer='both';roleSelect.value='0';eventSelect.value='0';slider.value='0.5';controls.querySelectorAll('select')[2].value='both';refreshPoints();draw();},destroy(){root.replaceChildren();}};
    }
  };
}

function waitForSVG(mount,signal){
  const found=mount?.querySelector('svg.spiral-svg');if(found)return Promise.resolve(found);
  return new Promise((resolve,reject)=>{
    if(!mount||signal.aborted){reject(new DOMException('Aborted','AbortError'));return;}
    const cleanup=()=>{observer.disconnect();signal.removeEventListener('abort',abort);};
    const abort=()=>{cleanup();reject(new DOMException('Aborted','AbortError'));};
    const observer=new MutationObserver(()=>{const node=mount.querySelector('svg.spiral-svg');if(node){cleanup();resolve(node);}});
    observer.observe(mount,{childList:true,subtree:true});signal.addEventListener('abort',abort,{once:true});
  });
}
function spiralDefinition(d3){
  return{
    sectionId:'5.4',title:['解剖同一个日期扇环','Inspect one actual date segment'],
    goal:['对照真实 θ/r/x/y、角增量和四顶点；背景全年只借用一次。','Compare actual θ/r/x/y, angle increment and four vertices; reuse the existing yearly background.'],
    source:['原 SVG 已绑定日期及几何；天气来源待教师核对。实际 demo 是 A 圆弧，讲义是 L 四边形，参数也不同；不视为完全同义。','Actual dates and geometry bound to the original SVG; weather provenance awaits review. The demo uses A arcs while the lecture uses L segments and different parameters.'],
    steps:[
      step('radius',['① 半径','① Radius'],[range(0,8,14)],['半径 r=bθ；画圆心到真实起点的线。角度单位是弧度。','Radius r=bθ; the line joins the origin to the actual start point. Angles are radians.']),
      step('projection',['② x/y 投影','② x/y projection'],[range(0,11,12)],['x=r cosθ，y=r sinθ。虚线与表格对应真实几何，不是示意坐标。','x=r cosθ and y=r sinθ. Guides and the table use actual geometry.']),
      step('delta',['③ 角增量','③ Angle increment'],[range(1,2,3),range(1,9,11)],['Δθ=boxSize/√(b²+r²)。这里采样并不保证一圈是一年。','Δθ=boxSize/√(b²+r²). This sampling does not guarantee one year per revolution.']),
      step('vertices',['④ 四个顶点','④ Four vertices'],[range(2,3,10)],['起点外→终点外→终点内→起点内；图中用当前 demo 的 ringT=1.4，不冒充讲义 coilGap/2。','Outer start → outer end → inner end → inner start; actual demo ringT=1.4, distinct from lecture coilGap/2.']),
      step('path',['⑤ 闭合路径','⑤ Closed path'],[range(2,11)],['原 demo 的 M/A/L/A/Z 路径闭合；四顶点由同一几何函数计算。','The original M/A/L/A/Z path is closed; all four vertices use the same geometry functions.'])
    ],
    async create(ctx){
      const {root,article,signal,t,selectStep}=ctx;
      const original=await waitForSVG(article.querySelector('.demo-mount'),signal);
      if(signal.aborted)throw new DOMException('Aborted','AbortError');
      const segs=d3.select(original).selectAll('path.seg').data();
      if(!segs.length)throw Error(t('原螺旋尚未生成扇环，请先打开完整演示后重试。','The original spiral has no segments. Open the complete demo and retry.'));
      let selected=0,current='radius',restored=false;
      const geometry=createSpiralGeometry(),placeholder=document.createComment('Original spiral position');
      original.before(placeholder);root.replaceChildren();
      const select=selectControl(root,t('真实日期扇环','Actual date segment'),segs.map((d,i)=>[String(i),`${i+1} / ${localKey(d.date)}`]),0,v=>{selected=+v;draw();},signal);
      const choices=el('div',{className:'tv-controls'});root.append(choices);
      for(const [label,index] of [[t('首','First'),0],[t('中','Middle'),Math.floor(segs.length/2)],[t('末','Last'),segs.length-1]])button(choices,label,()=>{selected=index;select.value=String(index);draw();},signal);
      root.append(original);const overlay=d3.select(original).append('g').attr('class','teaching-overlay').attr('pointer-events','none');
      const segments=d3.select(original).selectAll('path.seg'),handlers=[];
      segments.each(function(){const node=d3.select(this);handlers.push([this,node.on('mouseover'),node.on('mouseout')]);});
      segments.on('mouseover',null).on('mouseout',null).on('click.teaching',(_,d)=>{selected=segs.indexOf(d);select.value=String(selected);selectStep('path');});
      const zoom=svg('svg',{role:'img','aria-label':t('同一扇环局部放大','Magnified view of the same segment')});zoom.style.maxHeight='180px';root.append(el('p',{},t('局部放大：同一几何','Magnified: same geometry')),zoom);
      const output=el('div');root.append(output);
      function draw(){
        const d=segs[selected],p=geometry.pos(d.t0),points=geometry.vertices(d.t0,d.t1);
        overlay.selectAll('*').remove();
        overlay.append('path').attr('d',geometry.arcPath(d.t0,d.t1)).attr('fill','none').attr('stroke','#123e37').attr('stroke-width',4);
        if(['radius','projection','delta'].includes(current))overlay.append('line').attr('x1',0).attr('y1',0).attr('x2',p.x).attr('y2',p.y).attr('stroke','#123e37').attr('stroke-width',2);
        if(current==='projection')overlay.append('path').attr('d',`M 0 ${p.y} H ${p.x} V 0`).attr('fill','none').attr('stroke','#123e37').attr('stroke-dasharray','4 3');
        if(current==='delta'){const q=geometry.pos(d.t1);overlay.append('line').attr('x1',0).attr('y1',0).attr('x2',q.x).attr('y2',q.y).attr('stroke','#617e36').attr('stroke-width',2);}
        const bounds={x:Math.min(...points.map(p=>p.x))-4,y:Math.min(...points.map(p=>p.y))-4,w:Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))+8,h:Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))+8};
        zoom.setAttribute('viewBox',`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`);zoom.replaceChildren(svg('path',{d:geometry.arcPath(d.t0,d.t1),fill:'#dfeaa5',stroke:'#123e37','stroke-width':0.2}));
        points.forEach((point,i)=>{if(['vertices','path'].includes(current))overlay.append('circle').attr('cx',point.x).attr('cy',point.y).attr('r',3).attr('fill','#123e37');
          const mark=svg('circle',{cx:point.x,cy:point.y,r:0.6,fill:'#123e37',tabindex:0,role:'button','aria-label':`${i+1}: ${format(point.x)},${format(point.y)}`});
          const choose=()=>selectStep('vertices');mark.onclick=choose;mark.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();choose();}};zoom.append(mark);
        });
        output.replaceChildren(el('p',{className:'tv-result'},`${localKey(d.date)} · ${d.value==null?t('无温度数据','No temperature data'):`${d.value}°C`}\nθ₀=${format(d.t0)} → θ₁=${format(d.t1)}; Δθ=${format(d.t1-d.t0)}\nr=${format(p.r)}, x=${format(p.x)}, y=${format(p.y)}\nboxSize=22, b=${format(geometry.b)}, ringT=1.4`),table(['#','x','y'],points.map((p,i)=>[i+1,format(p.x),format(p.y)])));
        if(current==='path')output.append(el('p',{className:'tv-result'},geometry.arcPath(d.t0,d.t1)));
      }
      function restore(){if(restored)return;restored=true;overlay.remove();segments.on('click.teaching',null);handlers.forEach(([node,over,out])=>d3.select(node).on('mouseover',over).on('mouseout',out));placeholder.replaceWith(original);}
      signal.addEventListener('abort',restore,{once:true});draw();
      return{focus(id){current=id;draw();},reset(){selected=0;current='radius';select.value='0';draw();},destroy(){signal.removeEventListener('abort',restore);restore();root.replaceChildren();}};
    }
  };
}
