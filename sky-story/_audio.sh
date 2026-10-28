#!/usr/bin/env bash
# 扁平矢量科普片的声轨：低频铺底 + 木琴式拨弦动机（92 BPM）+ 切点 whoosh + 落点 tick + 关键数字 ding
set -e
cd "$(dirname "$0")"
mkdir -p assets/notes

# ---- 1. 铺底：C2 / G2 / C3 三个正弦，慢颤音，低通 ----
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "sine=f=65.41:d=30" -f lavfi -i "sine=f=98.00:d=30" -f lavfi -i "sine=f=130.81:d=30" \
  -filter_complex "[0:a]volume=0.30[a];[1:a]volume=0.16[b];[2:a]volume=0.10[c];[a][b][c]amix=inputs=3:normalize=0,lowpass=f=520,tremolo=f=0.12:d=0.25[out]" \
  -map "[out]" -ar 48000 -ac 1 assets/pad.wav

# ---- 2. 拨弦：基音 + 三次谐波，指数衰减 ----
# 时间(prompt 节奏点, 秒):频率
NOTES="0.00:261.63 1.30:392.00 1.96:440.00 2.61:329.63 3.91:392.00 5.22:261.63 5.87:293.66 6.52:392.00 7.83:440.00 9.13:329.63 10.43:392.00 11.09:523.25 13.04:440.00 14.35:392.00 16.30:293.66 16.96:329.63 17.61:392.00 18.26:440.00 19.57:392.00 20.87:329.63 22.00:261.63 23.48:392.00 24.78:440.00 26.09:523.25 28.15:261.63"

i=0
for n in $NOTES; do
  t=${n%%:*}; f=${n##*:}
  f3=$(awk "BEGIN{printf \"%.2f\", $f*3}")
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "sine=frequency=$f:duration=1.1" -f lavfi -i "sine=frequency=$f3:duration=1.1" \
    -filter_complex "[0:a]afade=t=out:st=0:d=1.05:curve=exp[a];[1:a]volume=0.14,afade=t=out:st=0:d=0.45:curve=exp[b];[a][b]amix=inputs=2:normalize=0,volume=0.16,afade=t=in:st=0:d=0.006[out]" \
    -map "[out]" -ar 48000 -ac 1 "assets/notes/n$i.wav"
  i=$((i+1))
done

# ---- 3. whoosh / tick / ding ----
ffmpeg -y -hide_banner -loglevel error -f lavfi -i "anoisesrc=d=0.6:color=pink:a=0.5" \
  -af "highpass=f=420,lowpass=f=4200,afade=t=in:st=0:d=0.24:curve=exp,afade=t=out:st=0.34:d=0.24:curve=exp,volume=0.22" \
  -ar 48000 -ac 1 assets/whoosh.wav

ffmpeg -y -hide_banner -loglevel error -f lavfi -i "sine=f=3150:d=0.06" \
  -af "afade=t=out:st=0:d=0.06:curve=exp,volume=0.30" -ar 48000 -ac 1 assets/tick.wav

ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "sine=f=880:d=1.9" -f lavfi -i "sine=f=1320:d=1.9" -f lavfi -i "sine=f=1760:d=1.9" \
  -filter_complex "[0:a]volume=0.28,afade=t=out:st=0.02:d=1.8:curve=exp[a];[1:a]volume=0.11,afade=t=out:st=0.02:d=1.2:curve=exp[b];[2:a]volume=0.05,afade=t=out:st=0.02:d=0.7:curve=exp[c];[a][b][c]amix=inputs=3:normalize=0[out]" \
  -map "[out]" -ar 48000 -ac 1 assets/ding.wav

# ---- 4. 把所有拨弦叠成一条 ----
cnt=$(ls assets/notes/n*.wav | wc -l | tr -d ' ')
ins=""; fc=""; lab=""; i=0
for n in $NOTES; do
  t=${n%%:*}
  ms=$(awk "BEGIN{printf \"%d\", $t*1000}")
  ins="$ins -i assets/notes/n$i.wav"
  fc="$fc[$i:a]adelay=$ms:all=1[d$i];"
  lab="$lab[d$i]"
  i=$((i+1))
done
ffmpeg -y -hide_banner -loglevel error $ins \
  -filter_complex "${fc}${lab}amix=inputs=$cnt:normalize=0[out]" \
  -map "[out]" -ar 48000 -ac 1 assets/plucks.wav

# ---- 5. 总混 ----
# whoosh 在切点前 0.12 秒起，tick 落在标签出现上，ding 落在 5.9× 上
ffmpeg -y -hide_banner -loglevel error \
  -i assets/pad.wav -i assets/plucks.wav -i assets/whoosh.wav -i assets/tick.wav -i assets/ding.wav \
  -filter_complex "\
[2:a]asplit=5[w0][w1][w2][w3][w4];\
[w0]adelay=5380:all=1,volume=0.55[o0];\
[w1]adelay=10880:all=1,volume=0.60[o1];\
[w2]adelay=16380:all=1,volume=0.60[o2];\
[w3]adelay=21880:all=1,volume=0.65[o3];\
[w4]adelay=27380:all=1,volume=0.70[o4];\
[3:a]asplit=5[t0][t1][t2][t3][t4];\
[t0]adelay=4300:all=1,volume=0.5[q0];\
[t1]adelay=9400:all=1,volume=0.5[q1];\
[t2]adelay=13200:all=1,volume=0.5[q2];\
[t3]adelay=20200:all=1,volume=0.5[q3];\
[t4]adelay=25200:all=1,volume=0.5[q4];\
[4:a]adelay=14400:all=1,volume=1.0[be];\
[0:a][1:a][o0][o1][o2][o3][o4][q0][q1][q2][q3][q4][be]amix=inputs=13:normalize=0,\
loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,alimiter=limit=0.94,afade=t=in:st=0:d=0.7,afade=t=out:st=28.9:d=1.1[out]" \
  -map "[out]" -ar 48000 -ac 2 assets/bed.wav

rm -rf assets/notes assets/pad.wav assets/plucks.wav assets/whoosh.wav assets/tick.wav assets/ding.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 assets/bed.wav
