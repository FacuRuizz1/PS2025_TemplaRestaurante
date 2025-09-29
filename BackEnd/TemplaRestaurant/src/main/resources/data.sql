-- Insertar persona administrador
INSERT INTO personas (id,nombre, apellido, email, telefono, dni, tipo_persona, fecha_alta, user_alta, fecha_baja, user_baja_id)
VALUES (30,'Admin', 'Sistema', 'admin@gmail.com', '0000000000', 99999999, 'PERSONAL', NOW(), 0, NULL, NULL);

-- Insertar usuario administrador con password ENCRIPTADA
INSERT INTO usuarios (username, password, rol, activo, id_persona)
VALUES ('admin','$2a$10$NewaJBkpaQZu/1xsTnpAqOr5nSnIbmVAV0IqPq6kP/SDtfeQJ83Xy',  -- "admin123" ENCRIPTADO
           'ADMINISTRADOR',true,30);

INSERT INTO productos (id,nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo)
VALUES (30,'Harina de Trigo', 'INSUMO', 'KILOGRAMO', 50.0, 10.0, 100.0, true);