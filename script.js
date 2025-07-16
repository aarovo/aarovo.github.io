const leftCanvas = document.getElementById("leftCanvas");
const rightCanvas = document.getElementById("rightCanvas");
const leftCtx = leftCanvas.getContext("2d");
const rightCtx = rightCanvas.getContext("2d");
const remainingBox = document.getElementById("remaining");
const hintImage = document.getElementById("hint-image");
const nextBtn = document.getElementById("next-btn");
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
const clickThreshold = 30;

async function loadStage(stageNum) {
    //document.querySelector("h1").textContent = stageTitles[stageNum];
    document.getElementById("stage-title").textContent = `${stageTitles[stage]}`;

    const response = await fetch("differences.json");
    const data = await response.json();
    differences = data[`stage_${stageNum}`];
    found = [];

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
    hintImage.style.display = "none";
    nextBtn.style.display = "none";
}

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
    });
}

function handleClick(event, isRight) {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 좌표 변환 (Canvas 크기 기준)
    for (let i = 0; i < differences.length; i++) {
        if (found.includes(i)) continue;
        const [dx, dy, objNum] = differences[i];

        const adjustedX = isRight ? dx : dx; // 좌표는 동일
        const adjustedY = dy;

        if (distance(x, y, adjustedX, adjustedY) < clickThreshold) {
            found.push(i);
            drawCircle(leftCtx, adjustedX, adjustedY);
            drawCircle(rightCtx, adjustedX, adjustedY);

            // 안내문 표시
            hintImage.src = `img/${stage}/${stage}_obj${objNum}.png`;
            hintImage.style.display = "block";
            document.getElementById("hint-container").style.display = "flex"; // 컨테이너 보이기

            remainingBox.textContent = differences.length - found.length;
            if (found.length === differences.length) {
                nextBtn.style.display = "inline-block";
            }
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
        loadStage(stage);
    } else {
        alert("모든 스테이지를 완료했습니다!");
    }
});

loadStage(stage);