
//import { query } from './db.js'

export const query = (text, params) => {
    console.log("ejecutando query", text, params)
    return pool.query(text, params)
}


export const login = async (req, res) => {
    const { email, password } = req.body

    try {
        const text = 'SELECT id, email FROM credentials WHERE email = $1 AND password = $2';
        const params = [email, password];

        const result = await query(text, params)

        //si no encontramos las credenciales
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales invalidas' });

        }
        else {
            const user = result.rows[0]
            return res.status(200).json({
                message: 'Login exitoso',
                userID: user.id,
                username: user.email
            })
        }
    } catch (err) {
        console.error("Error durante el login", err.stack); // Usar console.error
        // 3. SOLUCIÓN: Corregir la sintaxis de retorno (encadenamiento de .status().json())
        return res.status(500).json({
            error: 'Error interno del servidor'
        });
    }

};

export const register = async (req, res) => {

    const { name, lastname, email, password } = req.body;

   
    if (!name || !lastname || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para el registro.' });
    }

    try {
        
        const text = `
            INSERT INTO credentials (name, lastname, email, password)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email; 
        `;
        // 4. Crear el array de parámetros
        const params = [name, lastname, email, password];

        // 5. Ejecutar la consulta
        const result = await query(text, params);

        // La inserción fue exitosa. Retornamos los datos del nuevo usuario.
        // Asumiendo que RETURNING devolvió una fila (rows[0])
        const newUser = result.rows[0];

        return res.status(201).json({
            message: 'Registro exitoso. El nuevo usuario ha sido agregado a la base de datos.',
            userID: newUser.id,
            username: newUser.email
        });

    } catch (err) {
        // Manejo de errores, especialmente si el email ya existe (violación de restricción UNIQUE)
        if (err.code === '23505') { // Código de error de PostgreSQL para violación de UNIQUE constraint
            return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
        }

        console.error("Error durante el registro:", err.stack);
        return res.status(500).json({
            error: 'Error interno del servidor al intentar registrar el usuario.'
        });
    }
};