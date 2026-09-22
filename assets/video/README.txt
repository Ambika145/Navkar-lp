Drop the web-encoded background video here as:

    legacy.mp4     H.264 (yuv420p) + faststart   <- required
    legacy.webm    VP9                           <- optional, served first if present

The page loads these behind the "Navkar is back. Nine seasons." band.
If neither file exists the band falls back to the still photograph, so the
site is never broken by a missing video.

Target specs
------------
  duration   8-12 s, chosen to loop without a visible cut
  resolution 1920x1080 (or 1600x900 - it sits behind a dark scrim)
  framerate  24-30 fps
  audio      NONE - strip it. Muted autoplay is the only kind browsers allow,
             and the audio track is dead weight.
  size       2-4 MB for the mp4. Above ~6 MB it is not worth shipping.

If you have ffmpeg, this is the whole job (source is assets/images/IMG_1533.MOV):

  ffmpeg -ss 00:00:05 -t 10 -i "../images/IMG_1533.MOV" \
    -an -vf "scale=1920:-2,fps=30" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow \
    -movflags +faststart legacy.mp4

  ffmpeg -ss 00:00:05 -t 10 -i "../images/IMG_1533.MOV" \
    -an -vf "scale=1920:-2,fps=30" \
    -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 legacy.webm

Adjust -ss to pick the best 10 seconds of the clip.
