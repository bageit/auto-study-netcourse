/**输出占位符内容 */
if (!window.place_holder_str) {
    place_holder_str = '----------------------------------------------------------------';
}

/**配置：自动检测完成状态轮询时长 */
let config_check_complete_time = 15 * 1000;

/**配置：切换页码间隔基础时长 */
let config_switch_page_base_time = 1 * 1000;

/**配置：控制翻页函数每个课件的执行次数 */
let config_switch_page_btn_call_count = 3,
    //当前课件翻页函数执行次数
    curr_switch_page_btn_call_count = 3;
	
// 介于有些课程会出现不论学习多久都不会完成的bug，每一课挂机的最大时长，单位毫秒
let config_switch_page_max_time = 6 * 60 * 1000,
	// 强跳定时器
	strong_jump_timer = null;
	startStrongJumpTimer();


//启动自动刷课任务
; (function (document) {
    //开始提示文字输出
    console.clear();
    console.info(place_holder_str);
    console.info(`请注意以下事项：
    1、保证浏览器已关闭同源策略
    2、网课平台正常登录有效
    3、已进入到课件播放页面(课件目录页不支持)`);
    console.info(place_holder_str);
	callback();
    function callback() {
        init();//初始化
    }
})(document);


/**
 * 获取页面标记判断课件是否已完成
 * 您正在学习课件...，本内容10分，你已累计获取0.00分，学习了00:06:35。最少要求学习60秒。
 * 已经学习完毕！获取了10分/总分10分。总计学习时间为：00:02:03。
 */
function isComplete() {
    let foot_remark = window.top.w_main.w_lms_content.document.querySelector("html").innerText;
	
    if (foot_remark.indexOf('正在学习') > -1) {
        console.info("定时检测：当前课件正在学习，请等待学习完成...");
        return false;
    }
    else if (foot_remark.indexOf('学习完毕') > -1) {
        console.info("定时检测：当前课件学习完毕，即将切换下一课件...");
        return true;
    }
}

/**获取已授权的学号 */
function getAuthorizedIds() {
    //可在此函数内对接后端接口，验证当前登录学号是否有权限使用本脚本
    //现在不做此功能，方便大家
    return [];
}

/**获取当前登录学员的学号 */
function getLoginId() {
    let id = window.top.w_top.document.querySelector(".fnt_title").innerText;
    id = id.substring(0, id.indexOf('(')).trim();
    console.info("当前登录学号为：", id);
    return id;
}

/**检测授权 */
function checkAuthorize() {
    //获取当前登录学员学号
    let id = getLoginId(),
        //获取授权学号
        ids = getAuthorizedIds(),
        //鉴权结果
        result = false;

    //未做检测授权
    if (ids && ids.length == 0) {
        result = true;
    }
    // if (ids && ids.length > 0) {
    //     // ids = JSON.parse(ids);
    //     // if (ids[id]) {
    //     if (ids.indexOf(id) > -1) {
    //         result = true;
    //     }
    // }

    if (result) {
        console.info("您的学号：", id, " 授权成功，即将自动刷课...");
    } else {
        console.error("您的学号：", id, " 未授权，请联系 suwei.me@qq.com...");
    }
    console.info(place_holder_str);
    return result;
}

/**获取当前课件的翻页按钮DOM集合 */
function getPageBtns() {
    let btns = window.top.w_main.w_lms_content.w_sco.w_content.w_sco.frameElement.contentDocument.querySelectorAll(".chapter span");

    if (btns) {
        if (btns.length > 1) {
            console.log("本课件有 " + btns.length + " 页，将进行第[" + (config_switch_page_btn_call_count - curr_switch_page_btn_call_count) + "次]翻页...");
        } else {
            console.log("本课件仅 " + btns.length + " 页，无需翻页...");
        }
    } else {
        console.error("本课件未找到页码按钮，请等待再次查找...");
    }

    return btns;
}

/**切换下一课件 */
function nextCourseWare() {
    //获取点击下一课件按钮
    let btn_next = window.top.w_main.w_code.document.querySelector("#btnNext");

    if (btn_next) {
        console.log(place_holder_str);
        console.log("切换下一个课件...");
        btn_next.click();//切换课件
        curr_switch_page_btn_call_count = config_switch_page_btn_call_count;//重置翻页函数执行次数限制
		
		startStrongJumpTimer();
		
    } else {
        console.error("找不到 <下一个> 按钮...");
    }
	
}

/* 启动一个强跳定时器，即清除再启动 */
function startStrongJumpTimer() {
	// 清除强跳定时器
	clearTimeout(strong_jump_timer);
	strong_jump_timer = setTimeout(() => {	
			console.info("当前课件存在问题，导致无法学习完毕，即将切换下一课件...")
			// 下一页
			nextCourseWare();
	}, config_switch_page_max_time);
}

/**切换课件页码 */
function switchPageBtn() {
    var btns = getPageBtns();//获取页码按钮
    if (btns && btns.length > 1) {
        for (let i = 1; i <= btns.length; i++) {
            setTimeout(() => {
                console.log("第 " + i + " 页");
                btns[i - 1].click();
                if (i == btns.length) {
                    console.log("本次翻页完成，剩余[" + curr_switch_page_btn_call_count + "次]，等待课件完成后切换下一个课件...");
                }
            }, i * config_switch_page_base_time);
        }
    }
}
/**控制函数执行次数 */
function setFunCallMaxTimes(fun, nextFun) {
    return function () {
        if (curr_switch_page_btn_call_count-- > 0) {
            // 执行函数
            return fun.apply(this);
        } else if (nextFun && typeof nextFun === 'function') {
            // 执行下一个函数
            return nextFun.apply(this);
        }
    };
}

/**启动 */
function start() {
    setInterval(() => {
        //本课件完成后，切换下一课件
		if (isComplete()) {
            nextCourseWare();
        }
        //课件未完成，则执行翻页
        else {
            setFunCallMaxTimes(switchPageBtn, function () {
                console.log("当前课件翻页次数已达上限[" + config_switch_page_btn_call_count + "次]，不再翻页...");
            })();
        }
    }, config_check_complete_time)
}

/**初始化 */
function init() {
    //检测授权
    if (checkAuthorize()) {
        //启动
        start();
    }
}
