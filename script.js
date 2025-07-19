const leftCanvas = document.getElementById("leftCanvas");
const rightCanvas = document.getElementById("rightCanvas");
const leftCtx = leftCanvas.getContext("2d");
const rightCtx = rightCanvas.getContext("2d");
const remainingBox = document.getElementById("remaining");
const nextBtn = document.getElementById("next-btn");
const continueBtn = document.getElementById("continue-btn");
const stageTitles = [
    "",
    "1. 도우 공급 및 이송",
    "2. 성형 작업",
    "3. 소스 도포 공정",
    "4. 치즈 토핑 살포",
    "5. 추가 토핑 투입",
    "6. 동결 작업",
    "7. 컨베이어 이송 및 전이",
    "8. 박스포장 된 상품 이송"
];

let stage = 1;
let differences = [];
let found = [];
let skipped = [];
const clickThreshold = 30;
let canClick = true;

let score = 21;
document.getElementById("score").textContent = ` ${score}`;

let timeLeft = 600;
let timerInterval;
let isPaused = false;

function setContinueHandler() {
    continueBtn.onclick = () => {
        const hintContainer = document.getElementById("hint-container");
        hintContainer.style.display = "none";
        canClick = true;
        isPaused = false;

        const allFound = found.length === differences.length;
        const hintHidden = hintContainer.style.display === "none";

        if (allFound && hintHidden) {
            nextBtn.style.display = "inline-block";
            isPaused = true;
        }
    };
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (!isPaused) {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert("시간 초과!");
        function showNextMissed() {
            while (i < differences.length && found.includes(i)) {
                i++;
            }
            if (i >= differences.length) {
                // 모든 누락된 차이점 표시 후 스코어 차감 및 다음 버튼 표시
                nextBtn.style.display = "inline-block";
                return;
            }

            const [dx, dy, risk, result, prevention] = differences[i];
            drawCircle(leftCtx, dx, dy);
            drawCircle(rightCtx, dx, dy);

            document.getElementById("risk-text").textContent = risk;
            document.getElementById("result-text").textContent = result;
            document.getElementById("prevention-text").textContent = prevention;

            const canvasTop = rightCanvas.getBoundingClientRect().top + window.scrollY;
            const hingY = dy + canvasTop + 40;
            const hintContainer = document.getElementById("hint-container");

            hintContainer.style.position = "absolute";
            hintContainer.style.transform = "translateX(-50%)";
            hintContainer.style.top = `${hingY}px`;
            hintContainer.style.display = "flex";

            skipped.push(i);
            found.push(i);
            remainingBox.textContent = differences.length - found.length;
            score -= skipped.length;
            document.getElementById("score").textContent = ` ${score}`;
            i++;
        }

        showNextMissed();
      }
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById("timer").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function loadStage(stageNum) {
    //document.querySelector("h1").textContent = stageTitles[stageNum];
    document.getElementById("stage-title").textContent = `${stageTitles[stage]}`;

    const response = await fetch("differences.json");
    const data = await response.json();
    differences = data[`stage_${stageNum}`];
    found = [];
    skipped = [];

    // 이미지 로드
    const leftImg = await loadImage(`img/${stageNum}/left.png`);
    const rightImg = await loadImage(`img/${stageNum}/right.png`);

    // Canvas 그리기
    leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
    rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
    leftCtx.drawImage(leftImg, 0, 0, leftCanvas.width, leftCanvas.height);
    rightCtx.drawImage(rightImg, 0, 0, rightCanvas.width, rightCanvas.height);

    // 남은 개수 표시
    remainingBox.textContent = differences.length;
    document.getElementById("hint-container").style.display = "none";
    nextBtn.style.display = "none";

    setContinueHandler();
}

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
    });
}

function handleClick(event, isRight) {
    if(!canClick) return;

    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 좌표 변환 (Canvas 크기 기준)
    for (let i = 0; i < differences.length; i++) {
        if (found.includes(i)) continue;
        const [dx, dy, risk, result, prevention] = differences[i];

        const adjustedX = isRight ? dx : dx; // 좌표는 동일
        const adjustedY = dy;

        if (distance(x, y, adjustedX, adjustedY) < clickThreshold) {
            found.push(i);
            drawCircle(leftCtx, adjustedX, adjustedY);
            drawCircle(rightCtx, adjustedX, adjustedY);

            document.getElementById("risk-text").textContent = risk;
            document.getElementById("result-text").textContent = result;
            document.getElementById("prevention-text").textContent = prevention;

            const hintContainer = document.getElementById("hint-container");
            hintContainer.style.position = "fixed";
            hintContainer.style.top = "50%";
            hintContainer.style.left = "50%";
            hintContainer.style.transform = "translate(-50%, -50%)";

            document.getElementById("hint-container").style.display = "flex";
            canClick = false;

            remainingBox.textContent = differences.length - found.length;
            isPaused = true;
            break;
        }
    }
}

function drawCircle(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

leftCanvas.addEventListener("click", (e) => handleClick(e, false));
rightCanvas.addEventListener("click", (e) => handleClick(e, true));

nextBtn.addEventListener("click", () => {
    stage++;
    if (stage <= 8) {
        isPaused = false;
        loadStage(stage);
    } else {
        if(score >= 15) {
            alert(`모든 스테이지를 완료했습니다!\n점수: ${score}`);
        }
        else {
            alert(`교육 기준을 통과하지 못했습니다.\n점수: ${score}`)
        }
    }
});

continueBtn.addEventListener("click", () => {
    const hintContainer = document.getElementById("hint-container");
    hintContainer.style.display = "none";
    canClick = true;
    isPaused = false;

    // skip 모드에서 안내문이 다 끝난 경우 혹은 모든 차이점을 직접 찾은 경우만 다음 버튼 표시
    const allFound = found.length === differences.length;
    // Only show nextBtn if all differences found, hint hidden, and skipped+found cover all
    if (
        allFound &&
        (!document.getElementById("hint-container").style.display || document.getElementById("hint-container").style.display === "none") &&
        skipped.length + found.length >= differences.length
    ) {
        nextBtn.style.display = "inline-block";
        isPaused = true;
    }
});

loadStage(stage);
startTimer();
// Add skip button event listener
document.getElementById("skip-btn").addEventListener("click", () => {
    canClick = false;
    isPaused = true;

    let i = 0;
    skipped = [];
    let nextBtnPending = false;

    function showNextMissed() {
        while (i < differences.length && found.includes(i)) {
            i++;
        }
        if (i >= differences.length) {
            // 모든 누락된 차이점 표시 후 스코어 차감 및 다음 버튼 표시
            score -= skipped.length;
            document.getElementById("score").textContent = ` ${score}`;
            nextBtnPending = true;
            return;
        }

        const [dx, dy, risk, result, prevention] = differences[i];
        drawCircle(leftCtx, dx, dy);
        drawCircle(rightCtx, dx, dy);

        document.getElementById("risk-text").textContent = risk;
        document.getElementById("result-text").textContent = result;
        document.getElementById("prevention-text").textContent = prevention;

        const canvasTop = rightCanvas.getBoundingClientRect().top + window.scrollY;
        const hingY = dy + canvasTop + 40;
        const hintContainer = document.getElementById("hint-container");

        hintContainer.style.position = "absolute";
        hintContainer.style.transform = "translateX(-50%)";
        hintContainer.style.top = `${hingY}px`;
        hintContainer.style.display = "flex";

        skipped.push(i);
        found.push(i);
        remainingBox.textContent = differences.length - found.length;
        i++;
    }

    continueBtn.onclick = () => {
        const hintContainer = document.getElementById("hint-container");
        hintContainer.style.display = "none";
        showNextMissed();

        const allFound = found.length === differences.length;
        const hintHidden = hintContainer.style.display === "none";

        if (allFound && hintHidden) {
            nextBtn.style.display = "inline-block";
            isPaused = true;
        }
    };

    showNextMissed();
});