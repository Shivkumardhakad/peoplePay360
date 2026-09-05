package com.dj.payroll.repositories;

import com.dj.payroll.entities.Payrun;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PayrunRepository extends JpaRepository<Payrun, String> {
    List<Payrun> findAllByOrderByPeriodStartDescCreatedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payrun p where p.id = :id")
    Optional<Payrun> findByIdForUpdate(@Param("id") String id);
}
