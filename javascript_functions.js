

//zip two single arrays into a 2-d array
		function zip(arrayA, arrayB) {
			var length = Math.min(arrayA.length, arrayB.length);
			var result = [];
			for (var n = 0; n < length; n++) {
				result.push([arrayA[n], arrayB[n]]);
			}
			return result;
		}
		
		//make random data for bar graph
		var data = [];
			for(i=0;i<10;i++){
					var x = Math.floor(Math.random()*100);
					if(x === 0){x=10};
					data.push({"h":x});
				}
				
				
//get min and max for an object
			var ymin = Math.min.apply(ymin, data.map(function(d){return d.h;}));
			var ymax = Math.max.apply(ymax, data.map(function(d){return d.h;}));
			
			
		<script>    
			function preloadImages(array) {
				if (!preloadImages.list) {
					preloadImages.list = [];
				}
				var list = preloadImages.list;
				for (var i = 0; i < array.length; i++) {
					var img = new Image();
					img.onload = function() {
					var index = list.indexOf(this);
						if (index !== -1) {
							// remove image from the array once it's loaded
							// for memory consumption reasons
							list.splice(index, 1);
						}
					}
					list.push(img);
					img.src = array[i];
				}
			}
			
			var sourceSwap = function () {
				var $this = $(this);
				var newSource = $this.data('alt-src');
				$this.data('alt-src', $this.attr('src'));
				$this.attr('src', newSource);
			};
			$(document).ready(function(){
				$('img.xyz').hover(sourceSwap, sourceSwap);
			});
	</script>
	
	
						<!--<img class="xyz img-responsive" src="cloud_banner_small.png" data-alt-src="cloudmask_banner_small.png">!-->
					<!--<a href="#"><img class="img-responsive" src="cloud_banner_small.png" onmouseover="this.src='cloudmask_banner_small.png'" onmouseout="this.src='cloud_banner_small.png'"></a>!-->
					<!--<img class="img-responsive" src="cloud_banner_small.png" onmouseover="this.src='cloudmask_banner_small.png'" onmouseout="this.src='cloud_banner_small.png'">!-->