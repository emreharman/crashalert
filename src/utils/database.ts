import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const dbName = 'crashalert.db';

export const openDB = async () => {
    return SQLite.openDatabase({ name: dbName, location: 'default' });
};

export const initDB = async () => {
    const db = await openDB();
    await db.transaction((tx: any) => {
        tx.executeSql(`
      CREATE TABLE IF NOT EXISTS emergency_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        surname TEXT,
        birth_year INTEGER,
        blood_type TEXT,
        health_notes TEXT,
        emergency_contacts TEXT
      );
    `);
    });
};

export const getProfile = async (): Promise<any | null> => {
    const db = await openDB();
    return new Promise(resolve => {
        db.transaction((tx: any) => {
            tx.executeSql('SELECT * FROM emergency_profile LIMIT 1', [], (_: any, result: any) => {
                if (result.rows.length > 0) {
                    resolve(result.rows.item(0));
                } else {
                    resolve(null);
                }
            });
        });
    });
};

export const saveProfile = async (form: {
    name: string;
    surname: string;
    birth_year: string;
    blood_type: string;
    health_notes: string;
    emergency_contacts: string;
}) => {
    const db = await openDB();
    const birthYear = form.birth_year ? parseInt(form.birth_year) : null;

    await db.transaction((tx: any) => {
        tx.executeSql('DELETE FROM emergency_profile');

        tx.executeSql(
            `INSERT INTO emergency_profile (name, surname, birth_year, blood_type, health_notes, emergency_contacts)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                form.name,
                form.surname,
                birthYear,
                form.blood_type,
                form.health_notes,
                form.emergency_contacts,
            ],
            () => {
                console.log('✅ Kayıt başarıyla kaydedildi.');
            },
            (_: any, error: any) => {
                console.error('❌ SQLite Insert Error:', error);
                return false; // hatayı işlemeye devam et
            }
        );
    });
};


export const deleteDB = async () => {
    return new Promise((resolve, reject) => {
        SQLite.deleteDatabase(
            { name: 'veritabani.db', location: 'default' },
            resolve,
            reject
        );
    });
};