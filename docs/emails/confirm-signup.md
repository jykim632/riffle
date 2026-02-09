# 회원가입 인증 메일 템플릿

Supabase Dashboard > Authentication > Email Templates > **Confirm signup**에 적용

## Subject

Riffle - 이메일 인증을 완료해주세요

## Body (HTML)

```html
<div style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e;">

  <!-- Header -->
  <div style="text-align: center; padding: 40px 0 24px;">
    <div style="font-size: 32px; margin-bottom: 8px;">📻</div>
    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #2563eb;">Riffle</h1>
    <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">경제 라디오 스터디</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px 24px; text-align: center;">
    <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">이메일 인증을 완료해주세요</h2>
    <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; line-height: 1.6;">
      아래 버튼을 클릭하면 이메일 인증이 완료되고<br/>Riffle 스터디에 참여할 수 있습니다.
    </p>

    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="18%" fillcolor="#2563eb">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">이메일 인증하기</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard"
       style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
      이메일 인증하기
    </a>
    <!--<![endif]-->

    <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
      버튼이 작동하지 않으면 아래 링크를 브라우저에 붙여넣으세요:<br/>
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard" style="color: #2563eb; word-break: break-all;">{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard</a>
    </p>
  </div>

  <!-- Spam notice -->
  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0 0; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
      메일이 보이지 않으면 <strong style="color: #374151;">스팸함</strong>을 확인해주세요.
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 24px 0; font-size: 11px; color: #9ca3af;">
    <p style="margin: 0;">본인이 요청하지 않았다면 이 메일을 무시해주세요.</p>
  </div>

</div>
```
