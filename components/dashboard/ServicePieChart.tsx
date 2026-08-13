import React, { useRef, useEffect } from 'react';

const ServicePieChart = ({ data }: { data: Array<{ name: string; count: number; total: number }> }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const total = data.reduce((acc, item) => acc + item.total, 0);
    if (total === 0) {
      // Draw empty placeholder circle
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, 2 * Math.PI);
      ctx.fillStyle = '#f1edea';
      ctx.fill();
      ctx.fillStyle = '#82756a';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Sem dados', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Removed Purple (#7B2FBE) as per @frontend-specialist rules. Replaced with Deep Charcoal (#1c1c1c).
    const colors = ['#1c1c1c', '#c9a84c', '#2ecc71', '#3b82f6', '#765444'];
    let startAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 90;

    data.forEach((item, index) => {
      const sliceAngle = (item.total / total) * 2 * Math.PI;
      const color = colors[index % colors.length];

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Draw percentage text inside slice
      const percent = Math.round((item.total / total) * 100);
      if (percent > 4) {
        const middleAngle = startAngle + sliceAngle / 2;
        const textX = centerX + Math.cos(middleAngle) * (radius * 0.65);
        const textY = centerY + Math.sin(middleAngle) * (radius * 0.65);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percent}%`, textX, textY);
      }

      startAngle += sliceAngle;
    });

    // Draw center circle for donut chart look
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.45, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

  }, [data]);

  return <canvas ref={canvasRef} width={240} height={240} className="mx-auto" />;
};

export default ServicePieChart;
