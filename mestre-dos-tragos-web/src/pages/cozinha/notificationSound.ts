let audioCtx: AudioContext | null = null;

function tocarTom(ctx: AudioContext, frequencia: number, inicioEm: number, duracao: number) {
  const oscilador = ctx.createOscillator();
  const ganho = ctx.createGain();

  oscilador.type = 'sine';
  oscilador.frequency.value = frequencia;

  // Fade-in/out rapido pra evitar estalo (click) no inicio/fim do tom.
  ganho.gain.setValueAtTime(0, inicioEm);
  ganho.gain.linearRampToValueAtTime(0.3, inicioEm + 0.02);
  ganho.gain.linearRampToValueAtTime(0, inicioEm + duracao);

  oscilador.connect(ganho);
  ganho.connect(ctx.destination);

  oscilador.start(inicioEm);
  oscilador.stop(inicioEm + duracao);
}

/**
 * Toca um "ding" curto de duas notas para avisar que um novo pedido chegou.
 * Falha em silencio se o navegador bloquear audio (ex: sem interacao previa
 * do usuario na pagina) — nunca deve quebrar a tela da cozinha por causa disso.
 */
export function tocarSomNotificacao() {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const agora = audioCtx.currentTime;
    tocarTom(audioCtx, 880, agora, 0.15);
    tocarTom(audioCtx, 1318.5, agora + 0.15, 0.2);
  } catch {
    // Ambiente sem suporte a Web Audio API (ou bloqueado) — segue sem som.
  }
}
