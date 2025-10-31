-- Insertar persona administrador
INSERT INTO personas (nombre, apellido, email, telefono, dni, tipo_persona, fecha_alta, user_alta, fecha_baja, user_baja_id)
VALUES ('Admin', 'Sistema', 'admin@gmail.com', '0000000000', 99999999, 'PERSONAL', NOW(), 0, NULL, NULL);

INSERT INTO personas (nombre, apellido, email, telefono, dni, tipo_persona, fecha_alta, user_alta, fecha_baja, user_baja_id)
VALUES ('Mateo', 'Moszoro', 'mateomoszoro@gmail.com', '1111111111', 12345678, 'CLIENTE', NOW(), 0, NULL, NULL);

INSERT INTO personas (nombre, apellido, email, telefono, dni, tipo_persona, fecha_alta, user_alta, fecha_baja, user_baja_id)
VALUES ('Facundo', 'Ruiz', 'facuruiz@gmail.com', '2222222222', 87654321, 'CLIENTE', NOW(), 0, NULL, NULL);

-- Insertar usuario administrador con password ENCRIPTADA
INSERT INTO usuarios (username, password, rol, activo, id_persona)
VALUES ('admin','$2a$10$NewaJBkpaQZu/1xsTnpAqOr5nSnIbmVAV0IqPq6kP/SDtfeQJ83Xy',  -- "admin123" ENCRIPTADO
           'ADMINISTRADOR',true,1);

INSERT INTO productos (nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo,precio)
VALUES ('Harina de Trigo', 'INSUMO', 'KILOGRAMO', 50.0, 10.0, 100.0, true,0);

INSERT INTO productos (nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo,precio)
VALUES ('Papas Fritas', 'ACOMPAÑANTE', 'UNIDAD', 30.0, 5.0, 50.0, true,2000);

INSERT INTO productos (nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo,precio)
VALUES ('Coca Cola', 'BEBIDA', 'LITRO', 40.0, 10.0, 100.0, true,3000);

INSERT INTO platos (nombre, descripcion, precio, descuento, disponible, tipo_plato, foto, fecha_alta, user_alta, fecha_baja, user_baja)
VALUES ('Milanesa Napolitana', 'Milanesa de ternera con salsa de tomate, jamón y queso gratinado.', 10000.00, 7500.00, TRUE, 'PRINCIPAL', 'https://templarestaurante.s3.us-east-1.amazonaws.com/platos/5f783b1e-7422-44ac-8252-959cb9cfc158_WhatsApp+Image+2025-10-12+at+8.29.48+PM.jpeg',
        NOW(), 1, NULL, NULL);

INSERT INTO platos_Detalle (id_plato, id_producto, cantidad)
VALUES (1, 1, 0.2);  -- 200 gramos de harina

INSERT INTO mesas (numero_mesa, estado_mesa)
VALUES ('2', 'DISPONIBLE');

INSERT INTO mesas (numero_mesa, estado_mesa)
VALUES ('3', 'DISPONIBLE');

INSERT INTO mesas (numero_mesa, estado_mesa)
VALUES ('4', 'DISPONIBLE');


-- Insertar disponibilidad - NOMBRES DE COLUMNAS CORREGIDOS
INSERT INTO disponibilidades (fecha, cupos_ocupados, cupos_maximos, activo)
VALUES (NOW(), 20, 30, true);

-- Disponibilidades para los próximos 30 días usando DATEADD para H2
INSERT INTO disponibilidades (fecha, cupos_ocupados, cupos_maximos, activo)
VALUES
    (CURRENT_DATE, 0, 30, true),
    (DATEADD('DAY', 1, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 2, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 3, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 4, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 5, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 6, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 7, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 8, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 9, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 10, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 11, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 12, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 13, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 14, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 15, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 16, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 17, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 18, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 19, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 20, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 21, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 22, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 23, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 24, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 25, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 26, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 27, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 28, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 29, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 30, CURRENT_DATE), 0, 30, true);