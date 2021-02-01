//enchant.js本体やクラスをエクスポートする
enchant();

//定数
SPEED_UP = 0.5; //ボールのスピードアップ量
BALL_SX = 0; //ボールの出現位置のx座標
BALL_SY = 108; //ボールの出現位置のy座標

//ページが読み込まれたときに実行される関数
window.onload = () => {

    //ゲームオブジェクトを作成する
    core = new Core(320, 320);

    //ゲームの初期化処理

    //fps（1秒あたりの画面の描画回数）を設定する（省略時は「30」）
    core.fps = 16;

    core.life = 3;
    core.score = 0;
    //面クリアフラグ
    core.clear = true;
    //コンボ数を格納するプロパティ
    core.combo = 1;

    //ゲームで使用する画像ファイルを指定する
    core.preload('img/baki_36px.png');

    //ファイルのプリロードが完了したときに実行される関数
    core.onload = () => {

        //背景
        let bg = new Sprite(320, 320);
        bg.backgroundColor = "#707070";
        core.rootScene.addChild(bg);

        //ブロックを格納する配列を定義
        blocks = [];

        //ボールのスプライトを作成する
        let ball = new Ball(BALL_SX, BALL_SY);

        //パドルを作成する
        let paddle = new Paddle(160 - 16, 320 - 32);

        //rootSceneのenterframeイベントリスナ
        core.rootScene.addEventListener('enterframe', function(e){
            let key;    //ブロックを格納する配列のインデックス
            //ブロックの色を定義した配列
            let colorptn = ['#0000ff', '#00ff00', '#ff0000', '#00ffff'];
            //1面をクリアしたなら、ブロックを生成して画面に配置する
            if(core.clear){
                key = 0;
                for(let i = 0; i < 5; i++){
                    for(let j = 0; j < 5; j++){
                        let block = new Block(i * 64, j * 14 + 30, colorptn[i % 4]);
                        block.key = key;
                        blocks[key] = block;
                        key ++;
                    }
                }
                //blockCountプロパティにインデックスキーの最終値（ブロックの総数）を代入する
                core.blockCount = key;
                core.clear = false;
                //ボールのxy方向の移動量を初期化する
                ball.vx = Math.abs(ball.vx);
                ball.vy = Math.abs(ball.vy);
            }
            //ボールとパドルの当たり判定
            if(ball.intersect(paddle)){
                //ボールがパドルの左半分側に当たったなら
                if(ball.x >= paddle.x && (ball.x + ball.width/2) <= (paddle.x + paddle.width/2)){
                    //左斜め上方向にボールが打ち返されるようにする
                    if(ball.vx > 0) ball.vx *= -1;
                //ボールがパドルの右半分側に当たったなら
                }else{
                    //右斜め上方向にボールが打ち返されるようにする
                    if(ball.vx < 0) ball.vx *= -1;
                }
                //ボールのスピードをアップ
                ball.vy += SPEED_UP;
                if(ball.vx > 0) ball.vx += SPEED_UP;
                if(ball.vx < 0) ball.vx -= SPEED_UP;
                //ボールを打ち返す
                ball.vy *= -1;
                //コンボを初期化する
                core.combo = 1;
            }
            //ボールとブロックの当たり判定
            //残っているブロックの数だけ繰り返す
            for(let i in blocks){
                if(blocks[i].intersect(ball)){
                    core.score += 100 * core.combo;
                    blocks[i].remove();
                    ball.vy *= -1;
                    core.blockCount--;
                    core.combo ++;
                    scoreLabel.score = core.score;
                }
            }

            //面クリア処理

            //全ブロックを消去したなら
            if(core.blockCount <= 0){
                core.clear = true;
                ball.x = BALL_SX;
                ball.y = BALL_SY;
            }

            //空振りの処理

            //画面下より☟に移動したなら
            if(ball.y > 320){
                lifeLabel.life = --core.life;
                if(core.life > 0){
                    ball.x = BALL_SX;
                    ball.y = BALL_SY;
                    ball.vx = ball.vy = 4;
                }else{
                    core.end();
                }
            }
        });

        let scoreLabel = new ScoreLabel(5, 0);
        scoreLabel.score = 0;
        scoreLabel.easing = 0;
        core.rootScene.addChild(scoreLabel);

        let lifeLabel = new LifeLabel(180, 0, 3);
        lifeLabel.heart[0].frame = 31;
        lifeLabel.heart[1].frame = 31;
        lifeLabel.heart[2].frame = 31;
        core.rootScene.addChild(lifeLabel);
    }

    //ゲームスタート
    core.start();
}

//ボールのスプライトを作成するクラス
let Ball = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y){
        enchant.Sprite.call(this, 36, 36);
        this.image = core.assets['img/baki_36px.png'];
        this.x = x;
        this.y = y;
        this.speed;
        this.vx = 4;
        this.vy = 4;
        this.addEventListener('enterframe', function(e){
            this.x += this.vx;
            this.y += this.vy;
            //左右の壁に当たったならx方向の移動を反転する
            if(this.x > 320-36 || this.x < 0) this.vx *= -1;
            //天井に当たったらy方向の移動を反転する
            if(this.y < 0) this.vy *= -1;
        });
        core.rootScene.addChild(this);
    },
    remove: function(){
        delete this;
    }
});

//パドルのスプライトを作成するクラス
let Paddle = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y){
        enchant.Sprite.call(this, 48, 16);
        this.backgroundColor = "#FFFFFF";
        this.x = x;
        this.y = y;
        this.speed = 8;
        this.addEventListener('enterframe', function(e){
            //左ボタンで左方向にパドルを移動する
            if(core.input.left && this.x > 0 - this.width/2){
                this.x -= this.speed;
            }
            //右ボタンで右方向にパドルを移動する
            if(core.input.right && this.x < 320 - this.width/2){
                this.x += this.speed;
            }
        });
      //タッチムーブでパドルを移動する
      this.addEventListener(Event.TOUCH_MOVE, function(e){
          this.x = e.x;
      });
      core.rootScene.addChild(this);
    }
})

//ブロックのスプライトを作成するクラス
let Block = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y, color){
        enchant.Sprite.call(this, 60, 10);
        this.backgroundColor = color;
        this.x = x;
        this.y = y;
        core.rootScene.addChild(this);
    },
    remove: function(){
        core.rootScene.removeChild(this);
        delete blocks[this.key];
        delete this;
    }
})
