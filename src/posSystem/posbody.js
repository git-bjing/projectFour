var posApp = angular.module('posBody',['globalapp']);


var baseUrl = posApp.value('baseUrl','http://localhost:888/');

// posApp.config(function($httpProvider){
//     $httpProvider.defaults.headers.post = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
// })

posApp.directive('posbody',['$http','baseUrl',function($http,baseUrl){
	return {
		restrict:'AEC',
		templateUrl:'./posbody.html',
		replace:true,
		link:function(scope,ele,attr){
			scope.totalPrice = scope.totalPrice || '0.00';
			scope.qty = scope.qty || 0;
			scope.discountRate = scope.discountRate || '100';
			// scope.discountPrice = scope.discountPrice || '0.00';
			scope.receipt = 0;
			scope.settlePrice = scope.settlePrice || '0.00';
			var acount = 0;
			//条形码改变事件
			scope.barCodeChange = function($event){
				if(!scope.barCode){
					return;
				}
				// console.log()
				if(!Number(scope.barCode)){
					// console.log(111)
					return;
				}
				var qrCode = scope.barCode;
				acount++;
				$http({
					method:'get',
					url:baseUrl + 'fetch',
					params:{qrCode:qrCode,random:Math.random()}
					// data:{qrCode:qrCode}
				}).then(function(res){
					// console.log(res)
					if(!res.data.status){
						scope.barCode = '';
						$event.target.focus();
						alert('未找到该商品');
						return;
					}
					var obj;

					var data = res.data.message[0];
					data.qty = 1;
					data.salePrice = data.salePrice.toFixed(2);
					data.totalPrice = (Number(data.qty) * Number(data.salePrice)).toFixed(2);
					data.discountPrice = data.totalPrice;
					scope.totalPrice = Number(data.totalPrice); //总价
					scope.discountPrice = Number(data.discountPrice).toFixed(2);
					
					scope.goodslist = scope.goodslist || [];
					if(acount === 1){
						// console.log(111)
						scope.settlePrice = (data.totalPrice * scope.rate/100).toFixed(2);
					}
					scope.qty = data.qty;
					
					if(scope.goodslist[0]){
						
						scope.settlePrice = 0;
						scope.goodslist.forEach(function(item,idx){
							// console.log(item)
							
							scope.totalPrice += Number(item.totalPrice);
							scope.qty += item.qty;
							
							if(item.qrCode == data.qrCode){
								item.qty++;
								item.totalPrice = (Number(item.qty) * Number(item.salePrice)).toFixed(2);
								
								item.discountPrice = item.totalPrice;
								
								obj = Object.assign({},item);
							}
							// console.log(scope.settlePrice)
							scope.settlePrice = Number(scope.settlePrice) + Number(item.qty) * Number(item.salePrice);
							
						})
						//用来临时存放总价
						scope.price = scope.settlePrice;
						scope.reci = (scope.settlePrice - (scope.settlePrice * scope.rate/100)).toFixed(2);
						scope.settlePrice = (scope.settlePrice * scope.rate/100).toFixed(2);
						scope.totalPrice = (scope.totalPrice * scope.rate/100).toFixed(2);
					}

					if(!obj){
						// scope.settlePrice = (data.totalPrice * scope.rate/100).toFixed(2);
						scope.goodslist.push(data);
						scope.settlePrice = 0;
						scope.goodslist.forEach(function(item){
							scope.settlePrice = Number(scope.settlePrice) + Number(item.qty) * Number(item.salePrice);
						})
						//用来临时存放总价
						scope.price = scope.settlePrice;
						scope.reci = (scope.settlePrice - (scope.settlePrice * scope.rate/100)).toFixed(2);
						scope.settlePrice = (scope.settlePrice * scope.rate/100).toFixed(2);
					}

					scope.barCode = '';
					$event.target.focus();
				})
			}
			scope.shade = false;
			scope.disco = false;
			//打折
			scope.priceOnSale = function(){
				if(scope.qty){
					scope.disco = true;
					scope.shade = true;
					var tot = Number(scope.totalPrice) + Number(scope.reci);
					// console.log(tot)
					scope.zhe = (tot - tot*(scope.rate/100)).toFixed(2);
					scope.shi = (tot*(scope.rate/100)).toFixed(2);
				}
			}
			
			//实收金额和折扣金额计算及赋值
			scope.rate = scope.rate || '100';
			scope.reci = scope.reci || '0.00';
			scope.disChange = function(){
				var tot = Number(scope.totalPrice) + Number(scope.reci);
				// console.log(tot)
				scope.zhe = (tot - tot*(scope.rate/100)).toFixed(2);
				scope.shi = (tot*(scope.rate/100)).toFixed(2);
			}
			// scope.paid = scope.totalPrice*(scope.rate/100);
			// scope.dis = scope.totalPrice - scope.totalPrice*(scope.rate/100);
			//关闭折扣框
			scope.close_disco = function(){
				scope.disco = false;
				scope.shade = false;
				scope.rate = scope.discountRate;
			}
			//确认打折
			scope.surePrice = function(){
				if(scope.rate == ''){
					return;
				}

				scope.discountRate = scope.rate;
				var total = Number(scope.totalPrice) + Number(scope.reci);
				scope.totalPrice = (total*(scope.rate/100)).toFixed(2);
				scope.reci = (total - total*(scope.rate/100)).toFixed(2);
				scope.settlePrice = (scope.settlePrice * scope.rate/100).toFixed(2);
				scope.disco = false;
				scope.shade = false;

				if(scope.rate == '100'){
					scope.settlePrice = scope.price.toFixed(2);
				}
			}
			scope.printMenu = false;
			//结算打印
			scope.clearing = function(){
				if(!scope.qty){
					return;
				}
				var orderNow = new Date();
				scope.ymd = orderNow.toLocaleDateString();//年-月-日
				scope.hms = orderNow.toLocaleTimeString();//时-分-秒
				scope.odd = scope.serailNum;//订单编号
				scope.goods = scope.goodslist;//商品列表
				scope.printPrice = scope.settlePrice;//总价
				scope.printDis = scope.rate;//折扣
				//scope.printDisPrice = scope.settlePrice*scope.printDis;//折后价
				scope.printMenu = true;
				
			}
			//打印小票
			scope.print = function(){

				$http({
					method:'POST',
					url:baseUrl + 'order',
					data:{ymd:scope.ymd,hms:scope.hms,odd:scope.odd,goods:JSON.stringify(scope.goods),
						printPrice:scope.printPrice,printDis:scope.printDis}
					
				}).then(function(res){
					if(res.data.status){
						scope.barCode = '';
						scope.goodslist = [];
						scope.settlePrice =  '0.00';
						scope.qty = 0;
						scope.receipt = 0;
						scope.reci = '0.00';
						scope.rate = '100';
						scope.discountRate = '100';
						var num = window.localStorage.getItem('num') || '1';
						// console.log(num)
						num = parseInt(num) + 1;
						window.localStorage.setItem('num',num.toString());//设置当天单数
						barCode();


						scope.printMenu = false;
					}else{
						$.alert('打印失败');
					}	
				})
			}
			//取消订单
			scope.cancel = function(){
				scope.printMenu = false;
			}
			//添加会员按键
			scope.addMember = function(){

			}
			//当天小票流水号
			barCode();
			function barCode(){
				var time = window.localStorage.getItem('time') || null;
				var number = window.localStorage.getItem('num') || '1';
				var now = new Date(),year = now.getFullYear(),
					month = now.getMonth() + 1,day = now.getDate(),
				 	hours = now.getHours(),min = now.getMinutes();
				month.toString().length < 2 ? month = ('0'+ month) : month;
				day.toString().length < 2 ? day = ('0'+ day) : day;
				hours.toString().length < 2 ? hours = ('0'+ hours) : hours;
				min.toString().length < 2 ? min = ('0'+ min) : min;
				currentTime = year+month+day;
				
				//把时间存入本地  第二天流水号重新开始
				if(time && time != currentTime){
					window.localStorage.setItem('time',currentTime);
					// window.localStorage.removeItem('num');
					number = '1';
				}
				//流水号后四位不足   补零
				if(number.length<4){
					for(var i=0;i<3;i++){
						number = '0' + number;
					}
				}
				scope.serailNum = year+month+day+hours+min+number;
			}
		}
	}
}])