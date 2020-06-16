//Sigmoids...

"use strict";
function sigmoid0(x)
{
	return x/(1+Math.abs(x));
}
function sigmoid1(x)
{
	if (x>=0.0) {
		return 1.0;
	} else {
		return 0.0;
	}
}
function sigmoid2(x)
{
	if (x>=0.0){
		return x;
	} else {
		return 0.0;
	}
}
function sigmoid3(x)
{
	return x;
}

//DOSE - Doses items for item X slave Y
//Numreq - number of items that are requested for item X for slave Y
//Instore - number of items for item X in master gauge (currently)
//store_last_tick - Number of items for item X in master gauge at time of last tick
//dole - Current dole for item X
//carry - carry for item X slave Y
//prev_req - Numreq for previous request for item X slave Y
//* doleinfo_last - Object with 2 values for last "tick period": numreq - total number or requests for item, numslave - number of slaves requesting that item
//debt - debt for item X slave Y

//Returns: Array of 3 elements
//0.Number of items to give in that dose
//1.New dole for item X
//2.New carry for item X slave Y
//3.New debt
function Dose(numreq,instore,store_last_tick,dole,carry,prev_req,numreq_total_adj,debt)
{
	numreq=Number(numreq);
	instore=Number(instore);
	var instore_adj=instore;
	if (instore_adj==0) instore_adj=0.1;
	
	var b=Math.trunc(prev_req/instore_adj*numreq);
	var inp1=[numreq,instore_adj,store_last_tick/numreq,dole,carry];//0..4
	var inp2=[prev_req/numreq,numreq/numreq_total_adj,store_last_tick/numreq_total_adj,prev_req/instore_adj,b,numreq_total_adj,store_last_tick,debt];//5..12
	var inputs=inp1.concat(inp2);
	var internal=new Array(20).fill(0);
	var outputs=[0,0,0,0];
	//NN: Please don't touch :), code is generated
	
outputs[0]=inputs[7]*0.8058582544;
outputs[0]=sigmoid2(outputs[0]);
outputs[1]=sigmoid0(outputs[1]);
outputs[2]=sigmoid0(outputs[2]);
outputs[3]=inputs[6]*0.2294657379;
outputs[3]=sigmoid0(outputs[3]);

	debt=debt || 0;
	if (outputs[0]>0.99) outputs[0]=1.0;
	
	var res1=Number(outputs[0])*numreq+outputs[3]+debt;
	var res_capped=Math.round(res1);
	
	if (res_capped>numreq) res_capped=numreq;
	if (res_capped>instore) res_capped=instore;
	if (res_capped<0) res_capped=0;
	
	res1=res1 || 0;
	res_capped=res_capped || 0;//Safeguard against wrong values
	debt=res1-res_capped;
	debt_cap=Math.round(numreq*1.5)+5;
	if (debt>debt_cap) debt=debt_cap;
	
	carry=sigmoid0(outputs[2]*carry+outputs[0]) || 0;
	return [res_capped,dole+outputs[1],carry,debt];
}

//TICK - Updates values for item X, should be called once for each item for each round of all slaves requesting that item
//Instore - number of items for item X in master gauge (currently)
//dole - Current dole for item X
//store_last_tick - Number of items for item X in master gauge at time of last tick (not this one)
//* doleinfo_last - Object with 2 values for last "tick period": numreq - total number or requests for item, numslave - number of slaves requesting that item
//* doleinfo_new - Object with 2 values for new "tick period": numreq - total number or requests for item, numslave - number of slaves requesting that item


//Returns: Array of 2 elements
//0.New dole for item X
//1.Guessed percentage average of items supplied in last 10 ticks
function Tick(instore,dole,store_last_tick,numreq_total_adj)
{
	var instore_adj=instore;
	if (instore_adj==0) instore_adj=0.1;
	var inputs=[instore,dole,store_last_tick/instore_adj,store_last_tick/numreq_total_adj,store_last_tick,numreq_total_adj];
	var internal=new Array(10).fill(0);
	var outputs=[0,0];
	//NN: Please don't touch :), code is generated
	
outputs[0]=inputs[3]*0.9364774823;
outputs[0]=outputs[0]*1.0*0.4590721726;
outputs[0]=sigmoid2(outputs[0]);
outputs[1]=outputs[0]*1.828422785;
outputs[1]=sigmoid3(outputs[1]);

	avg=outputs[1];
	if (numreq_total_adj<0.11) avg=1;//When no item's are requested, result is 0.1 ; In that case there is no deficit, so return 1 = 100% demand fulfilled
	if (avg>1) avg=1;
	if (avg<0) avg=0;
	
	return [sigmoid0(outputs[0]),avg];
}

module.exports = { Dose,Tick };