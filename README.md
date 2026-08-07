# Speaker List Image Renderer

공개 Google Sheets의 스피커 추천목록을 SVG 이미지로 만드는 독립 실행용 저장소입니다.
Cloudflare Cron Trigger가 매일 한국 시간 00:00과 12:00에 GitHub의 `workflow_dispatch`를 호출하고, GitHub Actions가 다섯 이미지를 다시 생성해 GitHub Pages에 배포합니다.

## 현재 운영 주소

디시인사이드 글에서 사용 중인 아래 주소는 변경하지 않았습니다.

- `https://speaker-list-images.bangjy9720.chatgpt.site/active.svg`
- `https://speaker-list-images.bangjy9720.chatgpt.site/small-active.svg`
- `https://speaker-list-images.bangjy9720.chatgpt.site/bookshelf.svg`
- `https://speaker-list-images.bangjy9720.chatgpt.site/floorstanding.svg`
- `https://speaker-list-images.bangjy9720.chatgpt.site/amp.svg`

현재 HTML 조각은 `dcinside-embed-current.html`에 보존했습니다. GitHub 버전 검증이 끝나기 전에는 디시 글의 이미지 주소를 바꿀 필요가 없습니다.

## 자동 생성 규칙

- Cloudflare 실행 시각: `0 3 * * *`, `0 15 * * *` UTC, 즉 한국 시간 12:00과 00:00
- GitHub 자체 `schedule` 트리거는 사용하지 않고 `workflow_dispatch`만 외부에서 호출
- 원본 시트: `1vx8GieHULsCZdPFP9p-5fH4Kex5pzYZJdL9SwWa8Cqs`
- 표시 열: 브랜드, 이름, 주요 사양, 현재 가격
- 브랜드·이름·가격과 맨 윗행만 굵게 표시
- 데이터에 맞춰 말줄임표가 생기지 않는 최소 열 너비 자동 적용
- 역대 할인가, 리뷰·측정치, 유의사항 열은 이미지에서 제외

## Cloudflare 예약 설정

GitHub의 `.github/workflows/render.yml`에는 자체 `schedule`을 두지 않습니다. Cloudflare Worker의 **Settings → Triggers → Cron Triggers**에 아래 두 개를 등록합니다.

```text
0 3 * * *
0 15 * * *
```

Cloudflare Cron은 UTC 기준이므로 한국 시간으로 각각 12:00과 00:00입니다. 연결 시험이 필요할 때만 임시로 `*/5 * * * *`를 추가하고, 확인 후 반드시 삭제합니다.

GitHub에서는 `workflow_dispatch`가 외부 호출을 받고, `push`는 렌더러 코드가 바뀌었을 때 검증과 배포를 실행합니다. `REFRESH_MODE`는 운영 시 `12h`로 유지합니다.

## 비용과 장기 운영

이 저장소는 공개 저장소이며 표준 `ubuntu-latest` 실행기를 사용하므로 GitHub Actions와 GitHub Pages에 별도 결제가 필요하지 않습니다. 저장소를 비공개로 바꾸거나 유료 대형 실행기를 사용하면 과금 조건이 달라질 수 있습니다.

Cloudflare Worker가 매일 두 번 `workflow_dispatch`를 호출하므로 GitHub의 예약 실행 지연에 의존하지 않습니다. GitHub 토큰은 Cloudflare의 `GITHUB_TOKEN` Secret에만 저장하며, 토큰이 만료되거나 폐기되면 새 토큰으로 교체해야 합니다. GitHub와 Cloudflare의 무료 정책이 유지되는 범위에서는 ChatGPT 구독 없이 장기 운영할 수 있습니다.

수동 생성과 검증:

```bash
npm test
npm run render
```

## GitHub Pages 주소

저장소의 **Settings → Pages → Build and deployment → Source**를 `GitHub Actions`로 한 번 설정해야 합니다. 이후 Cloudflare가 매일 두 차례 워크플로를 호출하고, 생성된 이미지를 바로 GitHub Pages에 배포합니다.

- `https://bangjy9720.github.io/Speaker_List/active.svg`
- `https://bangjy9720.github.io/Speaker_List/small-active.svg`
- `https://bangjy9720.github.io/Speaker_List/bookshelf.svg`
- `https://bangjy9720.github.io/Speaker_List/floorstanding.svg`
- `https://bangjy9720.github.io/Speaker_List/amp.svg`

GitHub Pages가 정상 배포된 것을 확인하기 전까지 현재 디시 글은 기존 `chatgpt.site` 주소를 유지합니다. 새 주소로의 전환은 자동으로 이루어지지 않습니다.
