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


-- Insertar disponibilidad - NOMBRES DE COLUMNAS CORREGIDOS
INSERT INTO disponibilidades (fecha, cupos_ocupados, cupos_maximos, activo)
VALUES (NOW(), 20, 30, true);

