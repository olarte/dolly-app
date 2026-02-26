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
  )
ON CONFLICT (id) DO NOTHING;
