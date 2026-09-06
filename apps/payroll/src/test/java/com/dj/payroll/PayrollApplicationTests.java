package com.dj.payroll;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.config.import=",
		"DB_URL=jdbc:postgresql://localhost:5432/oddo",
		"DB_USERNAME=postgres",
		"DB_PASSWORD=root"
})
class PayrollApplicationTests {

	@Test
	void contextLoads() {
	}

}
