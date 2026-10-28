#!/usr/bin/env bash
# 皮影戏的响动：鼓、板、小锣、铜丝声 + 台下的底噪。全部用 aevalsrc 合成，无采样文件。
set -e
cd "$(dirname "$0")"
mkdir -p assets/tmp

# 鼓：音高迅速下坠的闷响
ffmpeg -y -hide_banner -loglevel error -f lavfi \
  -i "aevalsrc='0.95*sin(2*PI*(56*t+58*(1-exp(-15*t))))*exp(-8.5*t)':d=0.8:s=48000" \
  -af "volume=0.9" -ac 1 assets/tmp/drum.wav

# 板（木鱼）：干、短、脆
ffmpeg -y -hide_banner -loglevel error -f lavfi \
  -i "aevalsrc='(0.55*sin(2*PI*1210*t)+0.30*sin(2*PI*1790*t)+0.12*sin(2*PI*2950*t))*exp(-58*t)':d=0.25:s=48000" \
  -af "volume=0.55" -ac 1 assets/tmp/clack.wav

# 小锣：不谐和分音，慢衰减
ffmpeg -y -hide_banner -loglevel error -f lavfi \
  -i "aevalsrc='(0.30*sin(2*PI*392*t)+0.20*sin(2*PI*587*t)+0.14*sin(2*PI*791*t)+0.09*sin(2*PI*1046*t)+0.05*sin(2*PI*1523*t))*exp(-2.1*t)':d=3:s=48000" \
  -af "volume=0.6" -ac 1 assets/tmp/gong.wav

# 铜丝一绷
ffmpeg -y -hide_banner -loglevel error -f lavfi \
  -i "aevalsrc='(0.32*sin(2*PI*2380*t)+0.14*sin(2*PI*3570*t))*exp(-15*t)':d=0.6:s=48000" \
  -af "volume=0.5" -ac 1 assets/tmp/ping.wav

# 台下底噪
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "aevalsrc='0.16*sin(2*PI*58*t)+0.07*sin(2*PI*87*t)':d=20:s=48000" \
  -f lavfi -i "anoisesrc=d=20:color=brown:a=0.5" \
  -filter_complex "[1:a]lowpass=f=340,volume=0.10[n];[0:a][n]amix=inputs=2:normalize=0,volume=0.5[out]" \
  -map "[out]" -ac 1 assets/tmp/room.wav

# 轨道上的板：72 BPM，从 6.0 秒到 18.5 秒，共 16 记
ins=""; fc=""; lab=""
for k in $(seq 0 15); do
  ms=$(awk "BEGIN{printf \"%d\", (6.0+$k*0.83333)*1000}")
  ins="$ins -i assets/tmp/clack.wav"
  fc="$fc[$k:a]adelay=$ms:all=1,volume=0.5[t$k];"
  lab="$lab[t$k]"
done
ffmpeg -y -hide_banner -loglevel error $ins \
  -filter_complex "${fc}${lab}amix=inputs=16:normalize=0,volume=0.75[out]" \
  -map "[out]" -ac 1 assets/tmp/ticks.wav

# 总混：底噪 + 板列 + 各个落点
ffmpeg -y -hide_banner -loglevel error \
  -i assets/tmp/room.wav -i assets/tmp/ticks.wav -i assets/tmp/drum.wav \
  -i assets/tmp/gong.wav -i assets/tmp/ping.wav -i assets/tmp/clack.wav \
  -filter_complex "\
[2:a]asplit=4[d0][d1][d2][d3];\
[d0]adelay=60:all=1[a1];\
[d1]adelay=600:all=1,volume=0.8[a2];\
[d2]adelay=4080:all=1,volume=0.9[a3];\
[d3]adelay=17860:all=1,volume=1.0[a4];\
[3:a]asplit=3[g0][g1][g2];\
[g0]adelay=2560:all=1,volume=0.42[b1];\
[g1]adelay=12620:all=1,volume=0.55[b2];\
[g2]adelay=17900:all=1,volume=0.70[b3];\
[4:a]adelay=4770:all=1,volume=0.85[p1];\
[5:a]asplit=3[c0][c1][c2];\
[c0]adelay=560:all=1,volume=0.9[q1];\
[c1]adelay=3320:all=1,volume=0.6[q2];\
[c2]adelay=5280:all=1,volume=0.8[q3];\
[0:a][1:a][a1][a2][a3][a4][b1][b2][b3][p1][q1][q2][q3]amix=inputs=13:normalize=0,\
loudnorm=I=-17:TP=-2:LRA=10,aresample=48000,alimiter=limit=0.93,afade=t=in:st=0:d=0.4,afade=t=out:st=19.1:d=0.9[out]" \
  -map "[out]" -ar 48000 -ac 2 assets/stage.wav

rm -rf assets/tmp
ffprobe -v error -show_entries format=duration -of csv=p=0 assets/stage.wav
