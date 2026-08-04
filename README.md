# Speaker List Image Renderer

공개 Google Sheets의 스피커 추천목록을 SVG 이미지로 만드는 독립 실행용 저장소입니다.
GitHub Actions가 매일 한국 시간 00:00와 12:00에 다섯 이미지를 다시 생성해 GitHub Pages에 배포합니다.

## 현재 운영 주소

디시인사이드 글에서 사용 중인 아래 주소는 변경하지 않았습니다.

- `https://speaker-list-images.bangjy9720.chatgpt.site/active.svg`
- `https://speaker-list-images.bangjy9720.chatgpt.site/small-active.svg`
- `https://speaker-list-images.bangjy9720.chatgpt.site/bookshelf.svg`
- `https://speaker-list-images.bangjy9720.chatgpt.site/floorstanding.svg`
- `https://speaker-list-images.bangjy9720.chatgpt.site/amp.svg`

현재 HTML 조각은 `dcinside-embed-current.html`에 보존했습니다. GitHub 버전 검증이 끝나기 전에는 디시 글의 이미지 주소를 바꿀 필요가 없습니다.

## 자동 생성 규칙

- 실행 시각: `0 3,15 * * *` UTC, 즉 한국 시간 00:00와 12:00
- 원본 시트: `1vx8GieHULsCZdPFP9p-5fH4Kex5pzYZJdL9SwWa8Cqs`
- 표시 열: 브랜드, 이름, 주요 사양, 현재 가격
- 브랜드·이름·가격과 맨 윗행만 굵게 표시
- 데이터에 맞춰 말줄임표가 생기지 않는 최소 열 너비 자동 적용
- 역대 할인가, 리뷰·측정치, 유의사항 열은 이미지에서 제외

수동 생성과 검증:

```bash
npm test
npm run render
```

## GitHub Pages 주소

저장소의 **Settings → Pages → Build and deployment → Source**를 `GitHub Actions`로 한 번 설정해야 합니다. 이후 워크플로가 매일 두 차례 이미지를 생성하고 바로 GitHub Pages에 배포합니다.

- `https://bangjy9720.github.io/Speaker_List/active.svg`
- `https://bangjy9720.github.io/Speaker_List/small-active.svg`
- `https://bangjy9720.github.io/Speaker_List/bookshelf.svg`
- `https://bangjy9720.github.io/Speaker_List/floorstanding.svg`
- `https://bangjy9720.github.io/Speaker_List/amp.svg`

GitHub Pages가 정상 배포된 것을 확인하기 전까지 현재 디시 글은 기존 `chatgpt.site` 주소를 유지합니다. 새 주소로의 전환은 자동으로 이루어지지 않습니다.
