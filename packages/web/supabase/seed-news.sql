-- Seed news items matching mock data from useMockAnalyticsData.ts

INSERT INTO news_items (id, title, body, flag, country_code, comments, published_at)
VALUES
  (
    'n1',
    'Fed mantiene tasas, proyecta más tiempo...',
    'La Reserva Federal decidió mantener las tasas de interés sin cambios por tercera reunión consecutiva, señalando que necesita más evidencia de que la inflación converge hacia su meta del 2% antes de considerar recortes.',
    '🇺🇸',
    'US',
    34,
    NOW() - INTERVAL '1 hour'
  ),
  (
    'n2',
    'BanRep mantiene tasas, inflación sigue...',
    'El Banco de la República señaló que la inflación sigue por encima de la meta del 3%, manteniendo una postura cautelosa frente a futuros recortes de la tasa de intervención.',
    '🇨🇴',
    'CO',
    18,
    NOW() - INTERVAL '4 hours'
  ),
  (
    'n3',
    'Inflación y PIB caen en Marzo, menor de lo...',
    'Los datos de inflación de marzo muestran una desaceleración mayor a la esperada. Los mercados reaccionan con optimismo ante posibles recortes de tasas en el segundo semestre del año.',
    '🇺🇸',
    'US',
    52,
    NOW() - INTERVAL '10 hours'
  ),
  (
    'n4',
    'Exportaciones cafeteras alcanzan récord...',
    'Colombia exportó más de 1.2 millones de sacos de café en febrero, impulsando la entrada de divisas y fortaleciendo el peso colombiano frente al dólar americano.',
    '🇨🇴',
    'CO',
    27,
    NOW() - INTERVAL '1 day'
  ),
  (
    'n5',
    'Precio del petróleo sube 3% tras tensiones...',
    'El crudo Brent subió más de 3% después de nuevas sanciones a productores clave. Colombia, como exportador neto, podría ver un impacto positivo en sus ingresos fiscales y en la balanza comercial.',
    '🇨🇴',
    'CO',
    41,
    NOW() - INTERVAL '6 hours'
  ),
  (
    'n6',
    'Datos de empleo en EE.UU. superan expectativas',
    'La economía estadounidense creó 275,000 empleos en el último mes, superando las proyecciones de 200,000. El dato reduce las probabilidades de un recorte de tasas en el corto plazo.',
    '🇺🇸',
    'US',
    63,
    NOW() - INTERVAL '14 hours'
  ),
  (
    'n7',
    'Remesas hacia Colombia crecen 12% interanual',
    'Las transferencias de colombianos en el exterior alcanzaron un nuevo máximo mensual, con Estados Unidos como principal origen. Este flujo continúa siendo un soporte clave para el peso.',
    '🇨🇴',
    'CO',
    15,
    NOW() - INTERVAL '1 day 6 hours'
  ),
  (
    'n8',
    'Dólar global se fortalece ante aversión al riesgo',
    'El índice DXY del dólar avanzó 0.8% en la semana, presionando a monedas emergentes. Analistas señalan que el diferencial de tasas sigue favoreciendo al billete verde.',
    '🇺🇸',
    'US',
    29,
    NOW() - INTERVAL '2 days'
  ),
  (
    'n9',
    'Balanza comercial de Colombia mejora en enero',
    'El déficit comercial se redujo un 18% frente al mismo periodo del año anterior, impulsado por mayores exportaciones de carbón y café. El dato fue mejor de lo esperado por el mercado.',
    '🇨🇴',
    'CO',
    22,
    NOW() - INTERVAL '2 days 4 hours'
  ),
  (
    'n10',
    'Powell: "No hay prisa para recortar tasas"',
    'El presidente de la Fed reiteró que el comité será paciente antes de reducir la tasa de referencia. Los mercados ajustaron sus expectativas, ahora apuntando al tercer trimestre para un posible recorte.',
    '🇺🇸',
    'US',
    78,
    NOW() - INTERVAL '18 hours'
  ),
  (
    'n11',
    'Peso colombiano entre las monedas más fuertes...',
    'El peso se apreció 1.2% frente al dólar en la semana, ubicándose como una de las monedas con mejor rendimiento en América Latina. Analistas atribuyen la fortaleza al flujo de remesas y commodities.',
    '🇨🇴',
    'CO',
    36,
    NOW() - INTERVAL '3 days'
  ),
  (
    'n12',
    'Inversión extranjera en Colombia sube 8%...',
    'La inversión extranjera directa en Colombia creció 8% en el último trimestre, concentrada en los sectores de energía y tecnología. El Ministerio de Hacienda destacó la confianza de los inversionistas.',
    '🇨🇴',
    'CO',
    19,
    NOW() - INTERVAL '3 days 2 hours'
  )
ON CONFLICT (id) DO NOTHING;
