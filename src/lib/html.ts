export const welcomingMsg = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>API</title>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        font-family: Arial, sans-serif;
        background: #0f172a;
        color: #e5e7eb;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 16px;
      }

      .container {
        width: 100%;
        max-width: 420px;
        text-align: center;
        background: #020617;
        padding: 32px 24px;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      }

      h1 {
        margin-bottom: 12px;
        color: #38bdf8;
        font-size: clamp(1.5rem, 4vw, 2rem);
      }

      p {
        opacity: 0.9;
        margin: 12px 0;
        font-size: clamp(0.95rem, 3vw, 1rem);
      }

      a {
        text-decoration: none;
      }

      code {
        background: #020617;
        padding: 6px 10px;
        border-radius: 8px;
        color: #38bdf8;
        font-size: 0.95rem;
      }

      a:hover code {
        opacity: 0.85;
      }

      @media (min-width: 768px) {
        .container {
          padding: 40px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🚀 Blablabook API</h1>
      <p>Bienvenue sur l’API</p>
      <p>
        Documentation :
        <a href="/api-docs"><code>Swagger</code></a>
      </p>
    </div>
  </body>
</html>
`;
