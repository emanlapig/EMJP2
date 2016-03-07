// EMJP2 JavaScript

var openItem = -1;
var startX = 0;
var tap = false;
var touchTime;
var editing = -1;
var listLength = 0;
var scrollLength = 0;

TweenLite.ticker.fps(80);

var emjpApp = angular
	.module("emjpModule", ['ngTouch'])
	.controller("wordEntryController", function($scope) {
		// STEP 2 - readings
		$scope.word = "word";
		$scope.wordSplit = [];
		$scope.wordDef = "";
		$scope.wordType = "";
		$scope.wordInd = 0;
		$scope.wordEntryBack1 = function() {
			// back to step 1
			TweenLite.to("#word-entry-step1",0.8,{css:{marginLeft:"0%"},ease:Power2.easeOut});
			TweenLite.to("#word-entry-step2",0.8,{css:{marginLeft:"100%"},ease:Power2.easeOut});
		}
		$scope.wordEntryStep2 = function() {
			// split word into characters for reading input
			if ($("#input-word").val()!=="") {
				this.word = $("#input-word").val();
				this.wordSplit = this.word.split("");
				$(".fg-input").val("");
				// show step 2
				TweenLite.to("#word-entry-step2",0.8,{css:{marginLeft:"0%"},ease:Power2.easeOut});
				TweenLite.to("#word-entry-step1",0.8,{css:{marginLeft:"-100%"},ease:Power2.easeOut});
			} else {
				alert("Please enter a word!");
			}
		};
		$scope.specialReading = function() {
			var word = $("#input-word").val();
			this.wordSplit = [word];
		}
		// STEP 3 - definition
		$scope.wordFg = [];
		$scope.wordRead = "";
		$scope.wordEntryBack2 = function() {
			this.wordFg = [];
			this.wordRead = "";
			// back to step 2
			TweenLite.to("#word-entry-step2",0.8,{css:{marginLeft:"0%"},ease:Power2.easeOut});
			TweenLite.to("#word-entry-step3",0.8,{css:{marginLeft:"100%"},ease:Power2.easeOut});
		};
		$scope.wordEntryStep3 = function() {
			this.wordFg = [];
			this.wordRead = "";
			// compile reading
			for (var i=0;i<this.wordSplit.length;i++) {
				this.wordFg.push($("#fg-input"+i).val());
				if ($("#fg-input"+i).val()=="") {
					this.wordRead+=this.wordSplit[i];
				} else {
					this.wordRead+=$("#fg-input"+i).val();
				}
			}
			// show step 3
			TweenLite.to("#word-entry-step3",0.8,{css:{marginLeft:"0%"},ease:Power2.easeOut});
			TweenLite.to("#word-entry-step2",0.8,{css:{marginLeft:"-100%"},ease:Power2.easeOut});
		};
		// STEP 4 - submit
		$scope.wordSubmit = function() {
			if ($("#input-def").val()!=="") {
				var wordDef = $("#input-def").val();
				var wordType = $("#select-type").val();
				var thisInd = 0;
				// get and ++ localStorage index
				if (editing==-1) {
					thisInd = window.localStorage.getItem('emjpVocab');
					thisInd++;
					window.localStorage.setItem('emjpVocab',thisInd);
				} else {
					thisInd = editing;
					window.localStorage.removeItem('emjpVocab'+thisInd);
				}
				// create word object and save to localStorage as string
				var wordObj = {
					word: this.word,
					wordSplit: this.wordSplit,
					wordFg: this.wordFg,
					wordRead: this.wordRead,
					def: wordDef,
					type: wordType,
					ind: thisInd
				}
				var lsName = 'emjpVocab'+thisInd;
				window.localStorage.setItem(lsName, JSON.stringify(wordObj));
				// reload list
				hideForm();
				this.loadList();
				editing = -1;
				// rebind vocab list item events
				window.setTimeout(bindItemEvents,1000);
			} else {
				alert("Please enter a definition!");
			}
		};

		// VOCABULARY LIST
		$scope.loadList = function() {
			// get list length
			var ind = window.localStorage.getItem('emjpVocab');
			$scope.vocabList = [];
			listLength = 0;
			// load list from localstorage
			for (var i=0;i<=ind;i++) {
				var item = window.localStorage.getItem('emjpVocab'+i);
				if (item!==null) {
					$scope.vocabList.push(JSON.parse(item));
					listLength+=40;
				}
			}
			scrollLength = -listLength+100;
			$("#vocab-list").pep({
				axis:'y',
				drag:function(e) {
					e.preventDefault();
				},
				elementsWithInteraction:'span, input',
				constrainTo:[scrollLength,0,64,0] //top right btm left
			});
		};
		$scope.showEditForm = function(ind) {
			closeItems();
			var item = JSON.parse(window.localStorage.getItem('emjpVocab'+ind));
			$("#input-word").val(item.word);
			$("#input-def").val(item.def);
			$("#select-type").val(item.type);
			editing = ind;
			showForm();
		};
		$scope.destroy = function(ind) {
			window.localStorage.removeItem('emjpVocab'+ind);
			closeItems();
			this.loadList();
		};
	})
	// truncate long definition filter
	.filter('cut', function () {
        return function (value, wordwise, max, tail) {
            if (!value) return '';
            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;
            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace != -1) {
                    value = value.substr(0, lastspace);
                }
            }
            return value + (tail || ' …');
        };
    });

function init() {
	if (typeof window.localStorage.emjpVocab === 'undefined') {
		localStorage.setItem('emjpVocab',-1);
	}
	// bind touch events
	bindItemEvents();
	$("input, select, .btn1").on('touchstart',function(event) {
		event.stopPropagation();
	});
	$("#list-bg, #header-bar, #footer-bar, #overlay-bg, #sidebar").on('touchstart',function(event) {
		event.preventDefault();
	});
	$("input").focus(function(event) {
		event.target.style.webkitTransform = 'translate3d(0px,-10000px,0)';
		webkitRequestAnimationFrame(function() { event.target.style.webkitTransform = ''; }.bind(this));
	});
};

function bindItemEvents(ind) {
	$(".item").unbind();
	$(".item").on({ 
		touchstart: function(event) {
			startX = event.originalEvent.touches[0].pageX;
			tap = true;
			touchTime = window.setTimeout(function() {
				tap = false;
			},80);
		},
		touchend: function(event) {
			var target = $(this).attr("id");
			var targetID = "#"+target;
			var targetInd = target.split("item")[1];
			var xDist = startX - event.originalEvent.changedTouches[0].pageX;

			if (targetInd==openItem) {
				TweenLite.to(targetID, 0.5, {css:{marginLeft:"0px"},ease:Power2.easeOut});
				openItem = -1;
			} else {
				closeItems();
				if (xDist>80) {
					TweenLite.to(targetID, 0.5, {css:{marginLeft:"-100px"},ease:Power2.easeOut});
					openItem = targetInd;
				} else {
					if (tap) {
						tap = false;
						//showForm();
						showWordView(targetInd);
					}
					openItem = -1;
				}
			}
		}
	});
	// bind list drag
	scrollLength = -listLength+100;
	$('#vocab-list').data('plugin_pep').options.constrainTo = [scrollLength,0,64,0];
};

function closeItems() {
	if (openItem!=-1) {
		var closeID = "#item"+openItem;
		TweenLite.to(closeID, 0.5, {css:{marginLeft:"0px"},ease:Power2.easeOut});
		openItem = -1;
	}
};


// PAGE TRANSITIONS

// New Word Entry Form
function showForm() {
	TweenLite.to("#word-entry",0.8,{css:{marginLeft:"0%"},ease:Power2.easeOut});
};

function hideForm() {
	$("#word-entry-step1").css("margin-left","0%");
	$("#word-entry-step2").css("margin-left","100%");
	TweenLite.to("#word-entry",0.8,{css:{marginLeft:"110%"},ease:Power2.easeOut,onComplete:function() {
		$("#word-entry-step3").css("margin-left","100%");
	}});
};

function resetForm() {
	$("input[type=text], textarea").val("");
	$("#select-type").val("n")
	showForm();
	editing = -1;
};

// View Word
function showWordView(ind) {
	var $scope = angular.element(document.getElementById("page-container")).scope();
	var l = $scope.vocabList.length;
	for (var i=0;i<l;i++) {
		if ($scope.vocabList[i].ind==ind) {
			$scope.$apply(function(){
				$scope.word = $scope.vocabList[i].word;
				$scope.wordSplit = $scope.vocabList[i].wordSplit;
				$scope.wordFg = $scope.vocabList[i].wordFg;
				$scope.wordRead = $scope.vocabList[i].wordRead;
				$scope.wordDef = $scope.vocabList[i].def;
				$scope.wordType = $scope.vocabList[i].type;
				$scope.wordInd = $scope.vocabList[i].ind;
			});
		}
	}
	TweenLite.to("#view-word",0.8,{css:{marginLeft:"0%"},ease:Power2.easeOut});
};

function hideWordView() {
	TweenLite.to("#view-word",0.8,{css:{marginLeft:"110%"},ease:Power2.easeOut});
};


// Settings Pages
function showSettings() {
	TweenLite.to("#settings-page",0.8,{css:{marginLeft:"0%"},ease:Power2.easeOut});
	closeSidebar();
};

function showSettingsPg2() {
	TweenLite.to("#settings-pg2",0.8,{css:{marginLeft:"0%"},ease:Power2.easeOut});
	loadSettingsPg2();
};

function loadSettingsPg2() {
	var ind = window.localStorage.getItem('emjpVocab');
	$("#ls-write").html("");
	for (var i=0;i<=ind;i++) {
		var item = window.localStorage.getItem('emjpVocab'+i);
		if (item!==null) {
			$("#ls-write").append("emjpVocab"+i+": "+item+"<br>");
		}
	}
	$("#usage-write").html(JSON.stringify(localStorage).length/1000000);
};

function clearLocalStorage() {
	window.localStorage.clear();
	loadSettingsPg2();
};

function hideSettingsPg2() {
	TweenLite.to("#settings-pg2",0.8,{css:{marginLeft:"110%"},ease:Power2.easeOut});
};

// Sidebar
function openSidebar() {
	TweenLite.to("#page-container, #header-bar, #footer-bar, #header-btn-area, #footer-btn-area", 0.5, {css:{left:"180px"},ease:Power2.easeOut});
	$("#close-sidebar-area").css("display","block");
};

function closeSidebar() {
	TweenLite.to("#page-container, #header-bar, #footer-bar, #header-btn-area, #footer-btn-area", 0.5, {css:{left:"0px"},ease:Power2.easeOut});
	$("#close-sidebar-area").css("display","none");
};